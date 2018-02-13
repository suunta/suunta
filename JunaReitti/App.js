import React, {Component} from "react";
import {ActivityIndicator, View, Text, ListView, TextInput, TouchableOpacity, StyleSheet} from "react-native";
import {List, ListItem} from "react-native-elements";

//import Autocomplete from 'react-native-autocomplete-input'; // 3.3.1

export default class JunaReitti extends Component<{}> {

    constructor(props) {
        super(props);

        this.state = {
            isLoading: true
        }
    }

    componentDidMount() {
        return fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/PSL/KE')
            .then((response) => response.json())
            .then(junat => junat.map(juna => {
                    return {
                        id: juna.trainNumber,
                        tunnus: juna.commuterLineID,
                        lahtoAika: juna.timeTableRows.filter((row) => row.stationShortCode === 'PSL' && row.trainStopping === true && row.type === 'DEPARTURE')[0].scheduledTime.slice(11, 16),
                        lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === 'PSL' && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack,
                        tuloAika: juna.timeTableRows.filter((row) => row.stationShortCode === 'KE' && row.trainStopping === true && row.type === 'ARRIVAL')[0].scheduledTime.slice(11, 16)
                    }
                })
            )
            //.then(junat => junat.filter(juna => juna.aikaTauluRivit.includes('DEPARTURE')))
            .then((responseJson) => {
                let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
                this.setState({
                    isLoading: false,
                    dataSource: ds.cloneWithRows(responseJson),
                }, function () {
                    // do something with new state
                });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {

        if (this.state.isLoading) {
            return (
                <View style={{flex: 1, paddingTop: 20}}>
                    <ActivityIndicator/>
                </View>
            );
        }


        return (
            <View style={{flex: 1, paddingTop: 20}}>
                <Text>id | Tunnus | Lähtöaika | Raide | Tuloaika</Text>
                <List>
                    <ListView
                        dataSource={this.state.dataSource}
                        renderRow={(rowData) =>
                            <Text>{rowData.id} | {rowData.tunnus} | {rowData.lahtoAika} | {rowData.lahtoRaide} | {rowData.tuloAika} </Text>}
                    />
                </List>
            </View>
        );
    }
}