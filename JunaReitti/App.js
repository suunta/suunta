import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Autocomplete from "./Components/Autocomplete";
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
            minimiAika: 0,
            userInput: ''
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
            this.setState({
                isRefreshing: true,
                data: [],
                minimiAika: 99999999
            });
            const trainLimit = 15;
            const offsetInMinutes = -30; // ainakin jonkin verran myöhästymisten takia
            let currentTime = new Date();
            currentTime.setMinutes(currentTime.getMinutes() + offsetInMinutes);
            let currentTimeISO = currentTime.toISOString();

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=' + trainLimit + '&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {
                    console.log("Käsitellään : " + juna.trainNumber);;

                    // Haetaan junalle ajantasaiset tiedot
                    fetch('https://rata.digitraffic.fi/api/v1/trains/latest/' + juna.trainNumber)
                        .then((response) => response.json())
                        .then(haetutJunat => haetutJunat.map(haettuJuna => {
                            console.log("Fetchattu tarkat tiedot: " + juna.trainNumber);
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

                                lahtoAikaObj = this.getArrDepTime(haettuJuna, this.state.lahtoLyhenne, 'DEPARTURE');
                                tuloAikaObj = this.getArrDepTime(haettuJuna, this.state.tuloLyhenne, 'ARRIVAL');

                                if (typeof (lahtoAikaObj) === 'undefined' || typeof (tuloAikaObj) === 'undefined') {
                                    console.log("Huono juna: " + haettuJuna.trainNumber);
                                    return;
                                }

                                lahtoAika = lahtoAikaObj.aika;
                                tuloAika = tuloAikaObj.aika;

								const raideIndex = this.state.lahtoLyhenne === 'PSL' && this.state.tuloLyhenne === 'HKI' && ['I', 'P'].includes(tunnus) ? 1 : 0;

                                const lahtoAikaPrint = this.formatIsoDateToHoursMinutes(lahtoAika);
                                const tuloAikaPrint = this.formatIsoDateToHoursMinutes(tuloAika);

                                console.log("lahtoAika : " + lahtoAika + " -> " + lahtoAikaPrint);
                                console.log("tuloAika : " + tuloAika + " -> " + tuloAikaPrint);

                                // Lasketaan matka-aika, jotta voidaan karsia järjettömät matkat pois
                                const traveltime = (new Date(tuloAika) - new Date(lahtoAika))/1000;
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
        for (let asema in this.state.asemat) {
            if (userInput.toUpperCase() === this.state.asemat[asema].stationName.toUpperCase()) {
                this.setState({
                    [type + 'Asema']: this.state.asemat[asema].stationName,
                    [type + 'Lyhenne']: this.state.asemat[asema].stationShortCode
                }, () => {
                    this.fetchTrainData();
                });
            }
        }
    }

    componentDidMount() {
        fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
            .then((response) => response.json())
            .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true && asema.stationShortCode !== 'PAU'))
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

    this.fetchTrainData(() => {
      this.setState({
        isRefreshing: false
      });
    });


  }

    renderHeader() {
        return (
            <View style={styles.junatHeader}>
                <Text>Tunnus</Text>
                <Text>Lähtöaika</Text>
                <Text>Lähtöraide</Text>
                <Text>Tuloaika</Text>
                {/*<Text>Poikkeus</Text>*/}
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
                    item.tuloPoikkeus === true ? (
                        <Text style={styles.poikkeusAika}>{'~' + item.tuloAika}</Text>
                    ) : (
                        <Text>{item.tuloAika}</Text>
                    )
                }
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
              <FlatList style={styles.listContainer}
                data = {sortBy(this.state.data, 'lahtoPvm')}//.filter(juna => juna.matkaAika < this.state.minimiAika*2.1)} // Kerroin 2.1 => jos lyhin reitti 5min, sallitaan 2.1*5min matka-aika toista reittiä pitkin
                keyExtractor = {item => item.id.toString()}
                ListHeaderComponent = {this.renderHeader}
                stickyHeaderIndices={[0]}
                renderItem = {this.renderItem}
                onRefresh={this.onRefresh}
                refreshing={this.state.isRefreshing}
              />
              <View style={styles.autoContainer}>
                <Autocomplete stations={this.state.asemat} placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}/>
                <Autocomplete stations={this.state.asemat} placeholder="Tuloasema" name="tulo" userInput={this.handleInput}/>
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
        height: 50
    },
    junat: {
        fontSize: 20
    },
    junatHeader: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#d3d3d3'
    },
    tunnus: {
        justifyContent: 'center',
        alignItems: 'center'
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
    }
});
