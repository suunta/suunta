import React, {Component} from "react";
import {ActivityIndicator, View, Text, ListView, TextInput, TouchableOpacity, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import InputfieldAsematAutocomplete from './components/InputfieldAsematAutocomplete.js';

import Autocomplete from 'react-native-autocomplete-input';
import AutocompleteExample from "./AutocompleteExample"; // 3.3.1

export default class JunaReitti extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            isLoading: true,
            isRefreshing: false,
            lahtoAsema: 'PSL',
            tuloAsema: 'KE'
        }
    }

    fetchTrainData = async () => {

        // Haetaan tämänhetkinen aika, jottei haeta jo menneitä junia - onko tarpeeton rajaus, toimiiko apin haku muutenkin oikein? -Mikko
        var currentTime = new Date();
        let currentTimeISO = currentTime.toISOString();

        let apiAddress = 'https://rata.digitraffic.fi/api/v1/live-trains/station/' + this.state.lahtoAsema + '/' + this.state.tuloAsema + '?limit=15&startDate=' + currentTimeISO + '';

        fetch(apiAddress)
            .then((response) => response.json())
            .then(junat => junat.map(juna => {
                    return {
                        id: juna.trainNumber,
                        tunnus: juna.commuterLineID,
                        lahtoAika: new Date(juna.timeTableRows.filter((row) => row.stationShortCode === 'PSL' && row.trainStopping === true && row.type === 'DEPARTURE')[0].scheduledTime).toString().slice(16, 21),
                        lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === 'PSL' && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack,
                        tuloAika: new Date(juna.timeTableRows.filter((row) => row.stationShortCode === 'KE' && row.trainStopping === true && row.type === 'ARRIVAL')[0].scheduledTime).toString().slice(16, 21)
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
    }

    componentDidMount() {
        console.log('!! mount');
        return this.fetchTrainData();
    }

    onRefresh = async () => {
        console.log('*** sync start');
        this.setState({
            data: null,
            isRefreshing: true
        });

        console.log('*** fetching data async');

        await this.setState({
            data: this.fetchTrainData()
        });

        console.log('*** fetch done');

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
                <Text>{item.tunnus}</Text>
                <Text>{item.lahtoAika}</Text>
                <Text>{item.lahtoRaide}</Text>
                <Text>{item.tuloAika}</Text>
            </View>
        );
    }

    render() {

        if (this.state.isLoading) {
            return (
                <View style={{flex: 1, paddingTop: 10}}>
                    <ActivityIndicator/>
                </View>
            );
        }


        return (
                <View style={{flex: 1, flexDirection:'column'}}>
                    <View style={{height: 150}}>
                        <View style={{flex: 5, flexDirection:'column'}}>
                            <Text>Lähtöasema: {this.state.lahtoAsema}</Text>
                            <AutocompleteExample/>
                        </View>

                        {/*
                        <View style={{flex: 1, flexDirection:'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEEEEE'}}>
                            <Text>{'->'}</Text>
                            <Text>{'<-'}</Text>
                        </View>
                        */}

                        <View style={{flex: 5, flexDirection:'column'}}>
                            <Text>Tuloasema: {this.state.tuloAsema}</Text>
                            <AutocompleteExample/>
                        </View>
                    </View>

                    <View style={{}}>
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
                    </View>
                </View>
        );
    }
}

const styles = StyleSheet.create ({
    junalista: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 26
    },
    junat: {
        fontSize: 20
    },
    junatHeader: {
        fontSize: 20,
        fontWeight: 'bold'
    }
});
