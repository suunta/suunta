import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";

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
            asemat: [],
            minimiAika: 0
        };
    }

    getArrDepTime(juna, stationShortCode, tyyppi) {
        const scheduledArrDepTime = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === stationShortCode && row.trainStopping === true && row.type === tyyppi && new Date(row.scheduledTime) > new Date())[0].scheduledTime);
        const liveEstimateArrDepTime = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === stationShortCode && row.trainStopping === true && row.type === tyyppi && new Date(row.scheduledTime) > new Date())[0].liveEstimateTime);
        console.log("*** Aika-arvio : " + liveEstimateArrDepTime);

        return liveEstimateArrDepTime != 'Invalid Date' ? liveEstimateArrDepTime : scheduledArrDepTime;
    };

    formatIsoDatetoHoursMinutes(date) {
        return date.getHours() + ":" + ("0"+date.getMinutes()).slice(-2);
    };

    fetchTrainData = () => {

        if(this.state.tuloLyhenne !== '' && this.state.lahtoLyhenne !== '') {
            this.setState({
                isRefreshing: true,
                data: [],
                minimiAika: 99999999
            });
            let currentTime = new Date();
            let currentTimeISO = currentTime.toISOString();
            let currentTimeISODate = new Date(currentTimeISO);

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=7&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {
                    console.log("Käsitellään : " + juna.trainNumber);

                    // Haetaan junalle ajantasaiset tiedot
                    fetch('https://rata.digitraffic.fi/api/v1/trains/latest/' + juna.trainNumber)
                        .then((response) => response.json())
                        .then(haetutJunat => haetutJunat.map(haettuJuna => {
                            console.log("Käsitellään 2 : " + juna.trainNumber);


                            let id = haettuJuna.trainNumber;
                            let tunnus = haettuJuna.commuterLineID;

                            let lahtoAika = '';
                            let lahtoRaide = '';
                            let tuloAika = '';

                            // Tarkistetaan, onko koko juna peruttu
                            if (haettuJuna.cancelled === true) {
                                lahtoRaide = '-';
                                tuloAikaPrint = 'peruttu';
                                // todo: syykoodi <- vaatii oman fetchin syykoodeista ja selityksistä
                            } else {
                                console.log('*** Asetellaan aikoja');

                                lahtoAika = this.getArrDepTime(haettuJuna, this.state.lahtoLyhenne, 'DEPARTURE');
                                tuloAika = this.getArrDepTime(haettuJuna, this.state.tuloLyhenne, 'ARRIVAL');

                                lahtoRaide = haettuJuna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack;
                                console.log("lahtoRaide : " + lahtoRaide);

                                const lahtoAikaPrint = this.formatIsoDatetoHoursMinutes(lahtoAika);
                                const tuloAikaPrint = this.formatIsoDatetoHoursMinutes(tuloAika);

                                console.log("lahtoAika : " + lahtoAika);
                                console.log("tuloAika : " + tuloAika);


                                // Lasketaan matka-aika, jotta voidaan karsia järjettömät matkat pois
                                const traveltime = (new Date(lahtoAika) - new Date(tuloAika))/1000;
                                console.log("traveltime : " + traveltime);

                                if (this.state.minimiAika > traveltime) {
                                    this.setState({
                                        minimiAika: traveltime
                                    });
                                }

                                return {
                                    id: id,
                                    tunnus: tunnus,
                                    lahtoPvm: lahtoAika,
                                    lahtoAika: lahtoAikaPrint,
                                    lahtoRaide: lahtoRaide,
                                    tuloAika: tuloAikaPrint,
                                    matkaAika: traveltime
                                }

                            }


                        }))
                        .then((responseJson) => {
                            this.setState({
                                isLoading: false,
                                data: this.state.data.concat(responseJson),
                                isRefreshing: false,
                            }, function () {
                                // do something with new state
                                console.log(responseJson);
                            });
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    /*
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
                            matkaAika: traveltime,
                        }

                        return {
                            id: juna.id,
                            tunnus: juna.tunnus,
                            lahtoPvm: lahtoPvm,
                            lahtoAika: lahtoAika,
                            lahtoRaide: juna.lahtoRaide,
                            tuloAika: tuloAikaPrint,
                            matkaAika: traveltime,
                        }

                        */
                    })
                )
                .catch(error => console.log(error))

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
                    console.log(this.state.data);
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
                        passengerTraffic: asema.passengerTraffic
                    }
                })
            )
            .then(asemat => this.setState({
            isLoading: false,
            asemat: asemat}));
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

    renderHeader() {
        return (
            <View style={styles.junalista}>
                <Text>Tunnus</Text>
                <Text>Lähtöaika</Text>
                <Text>Lähtöraide</Text>
                <Text>Tuloaika</Text>
                <Text>Poikkeus</Text>
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
                <Text style={styles.tunnus}>  !</Text>
            </View>
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
                <Input placeholder="Lähtöasema" userInput={this.handleDepartInput}/>
                <Input placeholder="Tuloasema" userInput={this.handleDestInput}/>
                </View>

                <List>
                    <FlatList
                        data = {sortBy(this.state.data, 'lahtoPvm')}//.filter(juna => juna.matkaAika < this.state.minimiAika*2.1)} // Kerroin 2.1 => jos lyhin reitti 5min, sallitaan 2.1*5min matka-aika toista reittiä pitkin
                        keyExtractor = {item => item.id.toString()}
                        ListHeaderComponent = {this.renderHeader}
                        renderItem = {this.renderItem}
                        onRefresh={this.onRefresh}
                        refreshing={this.state.isRefreshing}
                    />
                </List>
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
    },
    poikkeusAika: {
        color: 'red'
    }
});
