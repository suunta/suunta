import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Picker} from "react-native";
import Input from "./Components/Input";
import FAIcon from 'react-native-vector-icons/FontAwesome';
import MatIcon from 'react-native-vector-icons/MaterialIcons';
import sortBy from "lodash/sortBy";

export default class JunaReitti extends Component<{}> {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            isLoading: true,
            isRefreshing: false,
            lahtoAsema: this.props.lahtoAsema,
            lahtoLyhenne: this.props.lahtoLyhenne,
            tuloAsema: this.props.tuloAsema,
            tuloLyhenne: this.props.tuloLyhenne,
            asemat: [],
            minimiAika: 0,
          reitit: this.props.reitit,
        };
    }

    fetchTrainData = () => {
      console.log('3');
      console.log(this.state.lahtoAsema);


      if(this.state.tuloLyhenne !== '' && this.state.lahtoLyhenne !== '') {
            this.setState({
                isRefreshing: true,
                minimiAika: 99999999
            });
            let currentTime = new Date();
            let currentTimeISO = currentTime.toISOString();
            let currentTimeISODate = new Date(currentTimeISO);

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=15&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {

                    const fetchDepDate = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE' && new Date(row.scheduledTime)>currentTimeISODate)[0].scheduledTime);
                    const finalDepDate = fetchDepDate.getHours() + ":" + ("0"+fetchDepDate.getMinutes()).slice(-2);
                    const fetchArrDate = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === this.state.tuloLyhenne && row.trainStopping === true && row.type === 'ARRIVAL' && new Date(row.scheduledTime)>fetchDepDate)[0].scheduledTime);
                    const finalArrDate = fetchArrDate.getHours() + ":" + ("0"+fetchArrDate.getMinutes()).slice(-2);

                    const traveltime = (fetchArrDate-fetchDepDate)/1000;
                    if (this.state.minimiAika > traveltime) {
                        this.setState({
                            minimiAika: traveltime
                        });
                    }

                        return {
                            id: juna.trainNumber,
                            tunnus: juna.commuterLineID,
                            lahtoPvm: fetchDepDate,
                            lahtoAika: finalDepDate,
                            lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack,
                            tuloAika: finalArrDate,
                            matkaAika: traveltime
                        }
                    })
                )
                .catch(error => console.log(error))
                .then((responseJson) => {
                    this.setState({
                        isLoading: false,
                        data: responseJson,
                        isRefreshing: false,
                    }, function () {
                        // do something with new state
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        }
        };

    componentDidMount() {
        fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
            .then((response) => response.json())
            .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
            .then(asemat => asemat.map(asema => {
                    /*if (asema.stationShortCode === this.state.lahtoLyhenne) {
                      this.setState({lahtoAsema: asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName});
                      console.log("löytyi listasta sama lahtolyhenne, se on " + this.state.lahtoLyhenne);
                      console.log("eli stateen asetetaan " + (asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName));
                    } else if (asema.stationShortCode === this.state.tuloLyhenne) {
                      this.setState({tuloAsema: asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName});
                      console.log("löytyi listasta sama tulolyhenne, se on " + this.state.tuloLyhenne);
                      console.log("eli stateen asetetaan " + (asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName));
                    }*/
                    return {
                        id: asema.stationUICCode,
                        stationShortCode: asema.stationShortCode,
                        stationName: asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName,
                        passengerTraffic: asema.passengerTraffic
                    }
                    
            }))
            .then(asemat => {
              this.setState({
                isLoading: false,
                asemat: asemat
              }, () => {
                this.fetchTrainData();
              })
            });
    
        
    }

    onRefresh = async () => {
        this.setState({
            isRefreshing: true
        });

        await this.setState({
            data: this.fetchTrainData()
        });

        this.setState({
            isRefreshing: false
        });

    };
    
    reverseRoute() {
      this.setState(prevState => ({
        lahtoAsema: prevState.tuloAsema,
        tuloAsema: prevState.lahtoAsema,
        lahtoLyhenne:prevState.tuloLyhenne,
        tuloLyhenne: prevState.lahtoLyhenne
      }), () => {
        this.fetchTrainData();
      });
    }  

    renderHeader() {
        return (
            <View style={styles.junalista}>
                <Text>Tunnus</Text>
                <Text>Lähtöaika</Text>
                <Text>Lähtöraide</Text>
                <Text>Tuloaika</Text>
            </View>
        );
    };

    renderItem({item, index}) {
        return (
            <View style={styles.junalista}>
                <Text style={styles.tunnus}>  {item.tunnus}</Text>
                <Text>{item.lahtoAika}</Text>
                <Text>{item.lahtoRaide}</Text>
                <Text>{item.tuloAika}</Text>
            </View>
        );
    }

    changedPickerValue(event) {
      console.log('2');
      console.log(this.state.lahtoAsema);


      console.log(event);
      this.setState({
        lahtoAsema: event.lahtoAsema,
        lahtoLyhenne: event.lahtoLyhenne,
        tuloAsema: event.tuloAsema,
        tuloLyhenne: event.tuloLyhenne,
      }, () => {
        this.fetchTrainData();
      })
    }

    render() {

        if (this.state.isLoading) {
            return (
                <View style={{flex: 1, paddingTop: 40}}>
                    <ActivityIndicator/>
                </View>
            );
        }

        console.log('1');
        console.log(this.state.lahtoAsema);

      let reitit = this.state.reitit.map((reitti, index) => (
        <Picker.Item key={index} label={reitti.lahtoAsema +' - '+reitti.tuloAsema} value={reitti} />
      ));

        return (
          <View style1={{flex: 1, paddingTop: 0}}>
            <View style={styles.toolbar}>
              <Text>{this.state.lahtoAsema}</Text>
              <FAIcon name="exchange" size={25} color="black" onPress={() => this.reverseRoute()}/>
              <Text>{this.state.tuloAsema}</Text>
              <Picker onValueChange={(event => this.changedPickerValue(event))} selectedValue={this.state.lahtoAsema +' - '+ this.state.tuloAsema} style={{width: 200}}>
                {reitit}
              </Picker>
              <FAIcon name="gear" size={25} color="black" onPress={() => this.props.navigation.navigate('Settings')}/>
              {/*<MatIcon name="location-on" size={25} color="#d3d3d3" />*/}
            </View>
            <FlatList
              data = {sortBy(this.state.data, 'lahtoPvm').filter(juna => juna.matkaAika < this.state.minimiAika*2.1)}
              keyExtractor = {item => item.id.toString()}
              ListHeaderComponent = {this.renderHeader}
              renderItem = {this.renderItem}
              onRefresh={this.onRefresh}
              refreshing={this.state.isRefreshing}
            />
          </View>
        );
    }
}

const styles = StyleSheet.create({
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5
    },
    junalista: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 50
    },
    junat: {
        fontSize: 20
    },
    junatHeader: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    tunnus: {
        height: 22,
        width: 22,
        borderRadius: 11,
        backgroundColor: '#EEEEEE',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
