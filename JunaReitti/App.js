import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Realm from 'realm';
import {StationSchema} from './StationSchema';
import {StationGroupSchema} from "./StationGroupSchema";

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
            minimiAika: 0,
            //depInp: '',
            //destInp: ''
        };
    }

    getArrDepTime(juna, stationShortCode, tyyppi) {
        let currentTime = new Date();

        const scheduledArrDepTime = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === stationShortCode && row.trainStopping === true && row.type === tyyppi && new Date(row.scheduledTime)>currentTime)[0].scheduledTime);
        const liveEstimateArrDepTime = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === stationShortCode && row.trainStopping === true && row.type === tyyppi && new Date(row.scheduledTime))[0].liveEstimateTime);

        console.log("Aikataulun mukainen aika : " + scheduledArrDepTime);
        console.log("Live-aika : " + liveEstimateArrDepTime);

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
            this.setState({
                isRefreshing: true,
                data: [],
                minimiAika: 99999999
            });
            let currentTime = new Date();
            let currentTimeISO = currentTime.toISOString();
            let currentTimeISODate = new Date(currentTimeISO);

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=6&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {
                    console.log("Käsitellään : " + juna.trainNumber);
                    console.log("*** Yritetään fetchiä ");

                    // Haetaan junalle ajantasaiset tiedot
                    fetch('https://rata.digitraffic.fi/api/v1/trains/latest/' + juna.trainNumber)
                        .then((response) => response.json())
                        .then(haetutJunat => haetutJunat.map(haettuJuna => {
                            console.log("Fetchattu : " + juna.trainNumber);


                            let id = haettuJuna.trainNumber;
							let tunnus = haettuJuna.commuterLineID !== "" ? haettuJuna.commuterLineID : haettuJuna.trainType + haettuJuna.trainNumber;
                

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

                                lahtoAikaObj = this.getArrDepTime(haettuJuna, this.state.lahtoLyhenne, 'DEPARTURE');
                                tuloAikaObj = this.getArrDepTime(haettuJuna, this.state.tuloLyhenne, 'ARRIVAL');

                                console.log(lahtoAikaObj);
                                console.log(tuloAikaObj);

                                lahtoAika = lahtoAikaObj.aika;
                                tuloAika = tuloAikaObj.aika;

                                //todo: ei toimi kehäradalla oikein
                                // lahtoRaide = haettuJuna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack;

								let raideIndex = this.state.lahtoLyhenne === 'PSL' && this.state.tuloLyhenne === 'HKI' && ['I', 'P'].includes(tunnus) ? 1 : 0;
								
                                const lahtoAikaPrint = this.formatIsoDateToHoursMinutes(lahtoAika);
                                const tuloAikaPrint = this.formatIsoDateToHoursMinutes(tuloAika);

                                console.log("lahtoAika : " + lahtoAika + " -> " + lahtoAikaPrint);
                                console.log("tuloAika : " + tuloAika + " -> " + tuloAikaPrint);

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
                                    lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[raideIndex].commercialTrack,
                                    tuloAika: tuloAikaPrint,
                                    matkaAika: traveltime,
                                    lahtoPoikkeus: lahtoAikaObj.poikkeus,
                                    tuloPoikkeus: tuloAikaObj.poikkeus,
                                }

                            }


                        }))
                        .then((responseJson) => {
                            this.setState({
                                data: this.state.data.concat(responseJson),
                                isRefreshing: false,
                            }, function () {
                                // do something with new state
                                // console.log(responseJson);
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
                    */
                    })
                )
                .catch(error => console.log(error))
                .then(() => {
                    this.setState({
                        isRefreshing: false
                    })
                })

        }
        };

	handleInput = (type, userInput) => {
			userInput = userInput.trim();
			userInput = userInput.charAt(0).toUpperCase() + userInput.substr(1).toLowerCase();
			/*
			this.setState({
                depInp: userInput.charAt(0).toUpperCase() + userInput.substr(1).toLowerCase()
            });
            */

			console.log(userInput);
			for (let asema in this.state.asemat) {
				if (userInput === this.state.asemat[asema].stationName) {
					if (type === "lahto") {
						console.log("Lahtoasema: " + userInput);
						this.setState({
							lahtoAsema: this.state.asemat[asema].stationName,
							lahtoLyhenne: this.state.asemat[asema].stationShortCode
						}, () => {
							this.fetchTrainData();
						});
					} else if (type === "tulo") {
						console.log("Tuloasema: " + userInput);
						this.setState({
								tuloAsema: this.state.asemat[asema].stationName,
								tuloLyhenne: this.state.asemat[asema].stationShortCode
							}, () => {
								this.fetchTrainData();
							});
					}
				}
			}
		};

    componentDidMount() {
        // Lisätään/tarkistetaan asemien tiedot
      Realm.open({schema: [StationSchema, StationGroupSchema], deleteRealmIfMigrationNeeded: true})
      .then(realm => {
        const stationsCount = realm.objects('Station').length;
        if (stationsCount === 0) {
            console.log('*** Asemia ei tietokannassa, haetaan ja lisätään ***');
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
                }))
                .then(asemat => {
                    this.setState({
                        asemat: asemat,
                        isLoading: false
                    });

                    console.log('*** Lisätään hakuajankohta ja asemat Realmiin');
                    realm.write(() => {
                        let updateTime = realm.create('StationGroup', {id: 1, lastUpdated: new Date(), stations: asemat})
                    })
                });
        }

        if (stationsCount > 0) {
            // Tarkistetaan viimeisin päivitysmpäivämäärä
            let stationGroup = Array.from(realm.objects('StationGroup'));

            // Jos data 24 tuntia vanhempaa, päivitetään
            if (stationGroup[0].lastUpdated.getTime()+86400000 < new Date() ) {
                console.log('*** Realmin data vanhaa, päivitetään');
            } else {
                console.log('*** Asemat on jo Realmissa, asetetaan '+ stationsCount +' asemaa stateen');
                const stationArray = Array.from(realm.objects('StationGroup'));
                this.setState({
                    isLoading: false,
                    asemat: stationArray.stations
                });
            }

        }
      })
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
                <Text>  {item.tunnus}</Text>
                {
                    // todo: Rumat ternaryt, saisiko näitä nätimpään muotoon? -Mikko
                    item.lahtoPoikkeus === true ? (
                        <Text style={styles.poikkeusAika}>{item.lahtoAika}</Text>
                    ) : (
                        <Text>{item.lahtoAika}</Text>
                    )
                }
                <Text>{item.lahtoRaide}</Text>
                {
                    item.lahtoPoikkeus === true ? (
                        <Text style={styles.poikkeusAika}>{'~' + item.tuloAika}</Text>
                    ) : (
                        <Text>{item.tuloAika}</Text>
                    )
                }
                <Text style={styles.tunnus}>{ item.lahtoPoikkeus || item.tuloPoikkeus ? '  !' : ''} </Text>
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
                <Input placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}/>
                <Input placeholder="Tuloasema" name="tulo" userInput={this.handleInput}/>

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
