import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
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

    fetchTrainData = () => {
        this.setState({
            isRefreshing: true
        });
        if(this.state.tuloLyhenne !== '' && this.state.lahtoLyhenne !== '') {

            let currentTime = new Date();
            let currentTimeISO = currentTime.toISOString();
			let currentTimeISODate = new Date(currentTimeISO);

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=15&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {

                    const fetchDepDate = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE' && new Date(row.scheduledTime)>currentTimeISODate)[0].scheduledTime);
                    const finalDepDate = fetchDepDate.getHours() + ":" + ("0"+fetchDepDate.getMinutes()).slice(-2);

                    const fetchArrDate = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === this.state.tuloLyhenne && row.trainStopping === true && row.type === 'ARRIVAL')[0].scheduledTime);
                    const finalArrDate = fetchArrDate.getHours() + ":" + ("0"+fetchArrDate.getMinutes()).slice(-2);

                        return {
                            id: juna.trainNumber,
                            tunnus: juna.commuterLineID,
                            lahtoAika: finalDepDate,
                            lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack,
                            tuloAika: finalArrDate
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
        for (let asema in this.state.asemat) {
            if (userInput === this.state.asemat[asema].stationName) {
                this.setState({
                        lahtoAsema: this.state.asemat[asema].stationName,
                        lahtoLyhenne: this.state.asemat[asema].stationShortCode
                    },
                    () => {
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
                {/*<Text>{this.state.lahtoAsema}</Text>
                <Text>{this.state.lahtoLyhenne}</Text>
                <Text>{this.state.tuloAsema}</Text>
                <Text>{this.state.tuloLyhenne}</Text>*/}

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
