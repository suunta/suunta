import React, {Component} from "react";
// import {List, ListItem} from "react-native-elements";
import Autocomplete from "./Components/Autocomplete";
import sortBy from "lodash/sortBy";
import Realm from 'realm';
import {StationSchema} from './StationSchema';
import {StationGroupSchema} from "./StationGroupSchema";
import {ActivityIndicator, View, Text, StyleSheet, FlatList, Platform, StatusBar, Keyboard, Alert } from "react-native";
import Permissions from 'react-native-permissions';

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
            locationPermission: ''
        };
    }

    getArrDepTime(juna, stationShortCode, tyyppi) {
        let currentTime = new Date();
        console.log("Haetaan " + tyyppi.toLowerCase() + "aika junalle " + juna.trainNumber);
        const newArrDepTime = juna.timeTableRows.filter((row) => row.stationShortCode === stationShortCode && row.trainStopping === true && row.type === tyyppi && (new Date(row.liveEstimateTime)>currentTime || new Date(row.scheduledTime)>currentTime))[0];

        if (typeof (newArrDepTime) === 'undefined') {
            return;
        }

        const scheduledArrDepTime = new Date(newArrDepTime.scheduledTime);
        const liveEstimateArrDepTime = new Date(newArrDepTime.liveEstimateTime);
        console.log(tyyppi + " Aikataulun mukainen aika : " + scheduledArrDepTime);
        console.log(tyyppi + " Live-aika : " + liveEstimateArrDepTime);
        let timeToReturn = '';
        let poikkeus = false;

        // Jos poikkeusaikaa ei ole, palautetaan aikataulun mukainen aika
        // Jos poikkeusajan ja aikatauluajan erotus on alle minuutin suuntaan tai toiseen, palautetaan aikataulun mukainen aika
        if (liveEstimateArrDepTime.toString() === 'Invalid Date' || Math.abs(liveEstimateArrDepTime - scheduledArrDepTime < 60000)) {
            timeToReturn = scheduledArrDepTime;
            console.log('Ei poikkeusta, aika : ' + timeToReturn);
        } else {
            timeToReturn = liveEstimateArrDepTime;
            console.log('!! Poikkeus, aika : ' + timeToReturn);
            poikkeus = true;
        }

        return {
            aika: timeToReturn,
            poikkeus: poikkeus,
        };
    };

    formatIsoDateToHoursMinutes(date) {
        return date.getHours() + ":" + ("0"+date.getMinutes()).slice(-2);
    };

    fetchTrainData = () => {

        if(this.state.tuloLyhenne !== '' && this.state.lahtoLyhenne !== '') {
            Keyboard.dismiss();
            this.setState({
                isRefreshing: true,
                data: [],
                minimiAika: 99999999
            });
            const trainLimit = 50;
            const offsetInMinutes = -30; // ainakin jonkin verran myöhästymisten takia
            let currentTime = new Date();
            currentTime.setMinutes(currentTime.getMinutes() + offsetInMinutes);
            let currentTimeISO = currentTime.toISOString();

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=' + trainLimit + '&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {
                    console.log("Käsitellään : " + juna.trainNumber);

                    // Haetaan junalle ajantasaiset tiedot
                    fetch('https://rata.digitraffic.fi/api/v1/trains/latest/' + juna.trainNumber)
                        .then((response) => response.json())
                        .then(haetutJunat => haetutJunat.map(haettuJuna => {
                            console.log("Fetchattu tarkat tiedot: " + juna.trainNumber);
                            let id = haettuJuna.trainNumber;
                            let tunnus = haettuJuna.commuterLineID !== "" ? haettuJuna.commuterLineID : haettuJuna.trainType + haettuJuna.trainNumber;

                            lahtoAikaObj = this.getArrDepTime(haettuJuna, this.state.lahtoLyhenne, 'DEPARTURE');
                            tuloAikaObj = this.getArrDepTime(haettuJuna, this.state.tuloLyhenne, 'ARRIVAL');

                            if (typeof (lahtoAikaObj) === 'undefined' || typeof (tuloAikaObj) === 'undefined' || (lahtoAikaObj.aika - tuloAikaObj.aika) > 2*60*1000) {
                                console.log("Huono juna: " + haettuJuna.trainNumber);
                                return;
                            }

                            const lahtoAika = lahtoAikaObj.aika;
                            const tuloAika = tuloAikaObj.aika;

                            const raideIndex = this.state.lahtoLyhenne === 'PSL' && this.state.tuloLyhenne === 'HKI' && ['I', 'P'].includes(tunnus) ? 1 : 0;

                            const lahtoAikaPrint = this.formatIsoDateToHoursMinutes(lahtoAika);
                            let tuloAikaPrint = this.formatIsoDateToHoursMinutes(tuloAika);

                            console.log("lahtoAika : " + lahtoAika + " -> " + lahtoAikaPrint);
                            console.log("tuloAika : " + tuloAika + " -> " + tuloAikaPrint);

                            // Lasketaan matka-aika, jotta voidaan karsia järjettömät matkat pois
                            const traveltime = (new Date(tuloAika) - new Date(lahtoAika))/1000;

                            if (this.state.minimiAika > traveltime) {
                                this.setState({
                                    minimiAika: traveltime
                                });
                            }

                            let lahtoRaide = juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[raideIndex].commercialTrack;

                            // Tarkistetaan, onko koko juna peruttu
                            if (haettuJuna.cancelled) {
                                lahtoRaide = '-';
                                tuloAikaPrint = 'peruttu';
                                lahtoAikaObj.poikkeus = true;
                                tuloAikaObj.poikkeus = true;
                                // todo: syykoodi <- vaatii oman fetchin syykoodeista ja selityksistä
                            }

                            return {
                                id: id,
                                tunnus: tunnus,
                                lahtoPvm: lahtoAika,
                                lahtoAika: lahtoAikaPrint,
                                lahtoRaide: lahtoRaide,
                                tuloAika: tuloAikaPrint,
                                matkaAika: traveltime,
                                lahtoPoikkeus: lahtoAikaObj.poikkeus,
                                tuloPoikkeus: tuloAikaObj.poikkeus,
                            }

                        }))
                        .then((responseJson) => {
                            if (typeof(this.state.data) === 'undefined') {
                                this.setState({
                                  data: [],
                                  isRefreshing: true,
                                })
                            }
                            if (typeof(responseJson[0]) !== 'undefined') {
                              this.setState({
                                data: this.state.data.concat(responseJson),
                              }, function () {
                                // do something with new state
                              });
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                    })
                )
                .catch(error => console.log(error))
                // tarpeellinen?
                .then(() => {
                    this.setState({
                        isRefreshing: false,
                    })
                })
        }
    };

    handleInput = (type, userInput) => {
        userInput = userInput.trim();
        if (userInput.length < 2) {
            this.setState({
                [type + 'Asema']: '',
                [type + 'Lyhenne']: ''
            })
        }
        else {
            for (let asema of this.state.asemat) {
                if (userInput.toUpperCase() === asema.stationName.toUpperCase()) {
                    // kirjaa ylös käytetyimmät asemat
                    Realm.open({schema: [StationSchema, StationGroupSchema], deleteRealmIfMigrationNeeded: true})
                    .then(realm => {
                        realm.write(() => {
                            realm.create('Station', {id: asema.id, used: asema.used+1}, true);
                        })
                        const stationRealm = realm.objectForPrimaryKey('Station', asema.id);
                        console.log("asemaa " + asema.stationName + " haettu " + asema.used + " kertaa");
                    })
                    this.setState({
                        [type + 'Asema']: asema.stationName,
                        [type + 'Lyhenne']: asema.stationShortCode
                    }, () => {
                        this.fetchTrainData();
                    });
                }
            }
        }
    }

	fetchStationsFromAPI = async () => {
	    let response = await fetch('https://rata.digitraffic.fi/api/v1/metadata/stations');
	    let data = await response.json();
	    let asematFiltteroity = data.filter((asema) => asema.passengerTraffic === true && asema.stationShortCode !== "PAU");
	    let asemat = asematFiltteroity.map(asema => {
            return {
                id: asema.stationUICCode,
                stationShortCode: asema.stationShortCode,
                stationName: (asema.stationName.split(" ")[1] && asema.stationName.split(" ")[1].toUpperCase() === "ASEMA")
                                ? asema.stationName.split(" ")[0]
                                : asema.stationName,
                passengerTraffic: asema.passengerTraffic,
                longitude: asema.longitude,
                latitude: asema.latitude
            }
        });
	    return asemat;
    };

    componentDidMount() {
        // Lisätään/tarkistetaan asemien tiedot
        Realm.open({schema: [StationSchema, StationGroupSchema], deleteRealmIfMigrationNeeded: true})
        .then(realm => {
            const stationsCount = realm.objects('Station').length;
            const stationGroup = Array.from(realm.objects('StationGroup'));
            if (stationsCount === 0 || stationGroup[0].lastUpdated.getTime()+86400000 < new Date()) {
                console.log('Haetaan asemat');
                this.fetchStationsFromAPI()
                    .then(asemat => {
                        console.log('*** Lisätään hakuajankohta ja asemat Realmiin');
                        realm.write(() => {
                            realm.create('StationGroup', {id: 1, lastUpdated: new Date(), stations: asemat}, true)
                        })
                        this.setState({
                            asemat: Array.from(realm.objects('StationGroup')[0].stations),
                            isLoading: false
                        });
                    })
                    .catch(error => console.log(error.message));
            } else {
                console.log('*** Asemat on jo Realmissa, asetetaan '+ stationsCount +' asemaa stateen');
//                const mostUsedStations = realm.objects('Station').filtered('used > 0').sorted('used', true);
//                let alertText = '';
//                for (let usedStation of Array.from(mostUsedStations)) {
//                    alertText += usedStation.stationName + " " + usedStation.used + "\n";
//                }
//                Alert.alert("Haetuimmat asemat", alertText);
                this.setState({
                    isLoading: false,
                    asemat: Array.from(realm.objects('StationGroup')[0].stations)
                });
            }
        })

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

        this.fetchTrainData(() => {
            this.setState({
                isRefreshing: false
            });
        });

    };

    renderHeader() {
        return (
            <View style={[styles.junatHeader]}>
                <Text>Tunnus</Text>
                <Text>Lähtöaika</Text>
                <Text>Lähtöraide</Text>
                <Text>Tuloaika</Text>
                {/*<Text>Poikkeus</Text>*/}
            </View>
        );
    };

    renderItem({item, index}) {
        let colors = ['#fff', '#F5F5F5'];
        let rowBackground = {backgroundColor: colors[index % colors.length]};
        return (
            <View style={[styles.junalista, rowBackground]}>
                <Text style={[styles.listCell, styles.tunnus]}>{item.tunnus}</Text>
                <Text style={[styles.listCell, styles.aika, item.lahtoPoikkeus && styles.poikkeusAika]}>{item.lahtoAika}</Text>
                <Text style={[styles.listCell, styles.raide]}>{item.lahtoRaide}</Text>
                <Text style={[styles.listCell, styles.aika, item.tuloPoikkeus && styles.poikkeusAika]}>{item.tuloAika}</Text>
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
            <View style={{flex: 1, marginTop: (Platform.OS == 'ios') ? 20 : 0}}>
                <StatusBar
                barStyle = {Platform.OS === 'ios' ? "dark-content" : "light-content"}
                hidden = {false}
                translucent = {false}
                networkActivityIndicatorVisible = {true}
                />
                <FlatList style={styles.listContainer}
                    data = {sortBy(this.state.data, 'lahtoPvm').filter(juna => !['I', 'P'].includes(juna.tunnus) || juna.matkaAika < this.state.minimiAika*2.1)} // Kerroin 2.1 => jos lyhin reitti 5min, sallitaan 2.1*5min matka-aika toista reittiä pitkin
                    keyExtractor = {item => item.id.toString()}
                    ListHeaderComponent = {this.renderHeader}
                    stickyHeaderIndices={[0]}
                    renderItem = {this.renderItem}
                    onRefresh={this.onRefresh}
                    refreshing={this.state.isRefreshing}
                />
                <View style={styles.autoContainer}>
                    <Autocomplete stations={this.state.asemat} placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}
                                  setLocationPermission = {locationPermission => this.setState({locationPermission})}/>
                    <Autocomplete stations={this.state.asemat} placeholder="Tuloasema" name="tulo" userInput={this.handleInput} lahto={this.state.lahtoAsema} />
                </View>
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
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#efefef'
    },
    junat: {
        fontSize: 20
    },
    junatHeader: {
        backgroundColor: '#7ece83',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#d3d3d3'
    },
    autoContainer: {
        position:'absolute',
        top: 0,
        flexDirection: 'row',
    },
    listContainer: {
        position:'absolute',
        top: 42,
        bottom: 0,
        width: '100%'
    },
    poikkeusAika: {
        color: 'red'
    },
    listCell: {
        width: '25%',
        fontSize: 16,
        textAlign: 'right'
    },
    tunnus: {
        textAlign: 'center'
    },
    aika: {
        paddingRight: "6%"
    },
    raide: {
        paddingRight: "10%"
    }
});
