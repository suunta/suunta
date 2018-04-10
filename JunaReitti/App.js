import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Button, ToastAndroid, Alert} from "react-native";
import {List, ListItem, Icon} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Permissions from 'react-native-permissions';
import geolib from 'geolib';

export default class JunaReitti extends Component {

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
            asemat: [],
            minimiAika: 0,
            locationPermission: '',
            latitude: null,
            longitude: null,
            error: null,
            lahinAsema: '',
            lahtoInput: '',
        };
    }

    fetchTrainData = () => {

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

    /*
    handleInput = (formName, userInput) => {
        console.log(userInput);
        for (let asema in this.state.asemat) {
            if (userInput === this.state.asemat[asema].stationName) {
                console.log("ensimmäinen loop " + userInput);
                if(formName === "lahto") {
                    this.setState({
                            lahtoAsema: this.state.asemat[asema].stationName,
                            lahtoLyhenne: this.state.asemat[asema].stationShortCode
                        },
                        () => {
                            this.fetchTrainData();
                        });
                }
                } else if(formName === "tulo") {
                this.setState({
                        tuloAsema: this.state.asemat[asema].stationName,
                        tuloLyhenne: this.state.asemat[asema].stationShortCode
                    },
                    () => {
                        this.fetchTrainData();
                    });
            }
        }
    };
    */

    handleDepartInput = (userInput) => {
        userInput = userInput.trim();
        console.log(userInput);
        this.setState({
            lahtoInput: userInput,
        })
        for (let asema in this.state.asemat) {
            if (userInput === this.state.asemat[asema].stationName) {
                this.setState({
                        lahtoAsema: this.state.asemat[asema].stationName,
                        lahtoLyhenne: this.state.asemat[asema].stationShortCode
                    }, () => {
                        this.fetchTrainData();
                    });
            }
        }
    };

    handleDestInput = (userInput) => {
        userInput = userInput.trim();
        for (let asema in this.state.asemat) {
            if (userInput === this.state.asemat[asema].stationName) {
                this.setState({
                    tuloAsema: this.state.asemat[asema].stationName,
                    tuloLyhenne: this.state.asemat[asema].stationShortCode
                }, () => {
                    this.fetchTrainData();
                });
            }
        }
    };

    componentDidMount() {
        fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
            .then((response) => response.json())
            .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
            .then(asemat => asemat.map(asema => {
                    return {
                        id: asema.stationUICCode,
                        stationShortCode: asema.stationShortCode,
                        stationName: asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName,
                        passengerTraffic: asema.passengerTraffic,
                        longitude: asema.longitude,
                        latitude: asema.latitude
                    }
                })
            )
            // .then(asemat => console.log(asemat))
            .then(asemat => this.setState({
            isLoading: false,
            asemat: asemat}));

            Permissions.check('location').then(response => {
                // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
                this.setState({ locationPermission: response })
                console.log(this.state.locationPermission)
            })
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

    reguestPermissionLocation = () => {
       
        if (this.state.locationPermission =! 'authorized') {
            Permissions.request('location').then(response => {
                // Returns once the user has chosen to 'allow' or to 'not allow' access
                // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
                this.setState({ locationPermission: response })
                this.getClosestStation()
            })  
        }
        this.getClosestStation()    
    }

    getClosestStation = () => {
        
        ToastAndroid.show('Haetaan sijaintia', ToastAndroid.SHORT)
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log(position);
                this.setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                },() => {
                    
                    let nykyinenSijainti = {"paikka": {latitude: this.state.latitude, longitude: this.state.longitude}}

                    //Haetaan asemien sijainnit ja formatoidaan ne oikeaan muotoon
                    let asemaSijainnit = {};
                    
                    for (var asema in this.state.asemat) {
                        let nimi = this.state.asemat[asema].stationName;
                        
                        asemaSijainnit[nimi] = {latitude: this.state.asemat[asema].latitude, longitude: this.state.asemat[asema].longitude}
                    }
                    
                    //Verrataan omaa sijaintia juna-asemien sijaintiin
                    let result = geolib.findNearest(nykyinenSijainti['paikka'], asemaSijainnit, 0);

                    console.log('Kutsutaan handleDeparttia parametrilla: ' + result.key);
                    this.handleDepartInput(result.key);
                });
            },
            (error) => {console.log(error.message); this.setState({ error: error.message }); ToastAndroid.show(error.message, ToastAndroid.SHORT);},
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
        );
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
                <Input placeholder="Lähtöasema" userInput={this.handleDepartInput} val={this.state.lahtoInput}/>
                <Input placeholder="Tuloasema" userInput={this.handleDestInput}/>
                </View>
                {/*<Text>{this.state.lahtoAsema}</Text>
                <Text>{this.state.lahtoLyhenne}</Text>
                <Text>{this.state.tuloAsema}</Text>
                <Text>{this.state.tuloLyhenne}</Text>*/}
                <Icon
                    name={'location-on'}
                    size={26}
                    onPress={ () => this.reguestPermissionLocation() }
                    title="Sijainti"
                />
                <List>
                    <FlatList
                        data = {sortBy(this.state.data, 'lahtoPvm').filter(juna => juna.matkaAika < this.state.minimiAika*2.1)}
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
