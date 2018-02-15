import React, {Component} from "react";
import {ActivityIndicator, View, Text, ListView, TextInput, TouchableOpacity, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";

//import Autocomplete from 'react-native-autocomplete-input'; // 3.3.1

export default class JunaReitti extends Component<{}> {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            isLoading: true,
            isRefreshing: false
        }
    }

    fetchTrainData = async () => {
        fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/PSL/KE')
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
        return this.fetchTrainData();
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
                {/*<Text>id | Tunnus | Lähtöaika | Raide | Tuloaika</Text>*/}
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