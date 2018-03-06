import React, {Component} from "react";
import {ActivityIndicator, View, Text, ListView, TextInput, TouchableOpacity, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input"

export default class JunaReitti extends Component<{}> {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            isLoading: true,
            isRefreshing: false,
            lahtoAsema: '',
            tuloAsema: '',
            lahtoLyhenne: '',
            tuloLyhenne: '',
            asemat: []
        };
    }

    // return this.fetchTrainData();

    fetchTrainData = () => {
        console.log("HAKEE " + this.state.tuloLyhenne + " " + this.state.lahtoLyhenne);
        fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne)
            .then((response) => response.json())
            .then(junat => junat.map(juna => {
                    return {
                        id: juna.trainNumber,
                        tunnus: juna.commuterLineID,
                        lahtoAika: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].scheduledTime.slice(11, 16), //slice(11, 16)
                        lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack,
                        tuloAika: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.tuloLyhenne && row.trainStopping === true && row.type === 'ARRIVAL')[0].scheduledTime.slice(11, 16) //slice(11, 16)
                    }
                })
            )
            .then((responseJson) => {
                this.setState({
                    isLoading: false,
                    data: responseJson,
                }, function () {
                    // do something with new state
                });
            })
            .catch((error) => {
                console.error(error);
            });
    };

    handleDepartInput = (userInput) => {
        for(let asema in this.state.asemat) {
            if(userInput === this.state.asemat[asema].stationName) {
                this.setState({
                    lahtoAsema: this.state.asemat[asema].stationName,
                    lahtoLyhenne: this.state.asemat[asema].stationShortCode
                },
                    ()=> {if(this.state.tuloLyhenne !== '' && this.state.lahtoLyhenne !== '') {
                    console.log("fetching train data");
                    this.fetchTrainData();
                }});
            }
        }
    };

    handleDestInput = (userInput) => {
            for(let asema in this.state.asemat) {
                //console.log(this.state.asemat[asema].stationName);
                if(userInput === this.state.asemat[asema].stationName) {
                    this.setState({
                        tuloAsema: this.state.asemat[asema].stationName,
                        tuloLyhenne: this.state.asemat[asema].stationShortCode
                    }, () => {if(this.state.lahtoLyhenne !== '' && this.state.tuloLyhenne !== '') {
                        console.log("fetching train data");
                        return this.fetchTrainData();
                    }});
                }
        }
        console.log(userInput);
    };

    componentDidMount() {
        fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
            .then((response) => response.json())
            .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
            .then(asemat => asemat.map(asema => {
                    return {
                        id: asema.stationUICCode,
                        stationShortCode: asema.stationShortCode,
                        stationName: asema.stationName,
                        passengerTraffic: asema.passengerTraffic
                    }
                })
            )
            // .then(asemat => console.log(asemat))
            .then(asemat => this.setState({
            isLoading: false,
            asemat: asemat}));
    }

    onRefresh = async () => {
        this.setState({
            isRefreshing: true
        });

        //await this.fetchTrainData();

        await this.setState({
            data: this.fetchTrainData()
        });

        this.setState({
            isRefreshing: false
        });

    };

    renderHeader() {
        return <View style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center'
        }}>
            <Text>Tunnus</Text>
            <Text>Lähtöaika</Text>
            <Text>Lähtöraide</Text>
            <Text>Tuloaika</Text>
        </View>
    };

    renderItem({ item, index }) {
        return <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center'
                }}>
                <Text>{item.tunnus}</Text>
                <Text>{item.lahtoAika}</Text>
                <Text>{item.lahtoRaide}</Text>
                <Text>{item.tuloAika}</Text>
        </View>;
    }

    render() {

        if (this.state.isLoading) {
            return (
                <View style={{flex: 1, paddingTop: 40}}>
                    <ActivityIndicator/>
                </View>
            );
        }

        return (
            <View style={{flex: 1, paddingTop: 0}}>

                <View style={styles.inputContainer}>
                <Input userInput={this.handleDepartInput}/>
                <Input userInput={this.handleDestInput}/>
                </View>
                {/*<Text>{this.state.lahtoAsema}</Text>
                <Text>{this.state.lahtoLyhenne}</Text>

                <Text>{this.state.tuloAsema}</Text>
                <Text>{this.state.tuloLyhenne}</Text>
                */}

                <List>
                    <FlatList
                        data = {this.state.data}
                        keyExtractor = {item => item.id.toString()}
                        ListHeaderComponent = {this.renderHeader}
                        renderItem = {this.renderItem}
                        onRefresh={this.onRefresh}
                        refreshing={this.state.isRefreshing}
                    />
                </List>
                {/*
                    <ListView
                        dataSource={this.state.dataSource}
                        renderRow={(rowData) =>
                            <Text>{rowData.id} | {rowData.tunnus} | {rowData.lahtoAika} | {rowData.lahtoRaide} | {rowData.tuloAika} </Text>}
                    />
                </List>
                */}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
});