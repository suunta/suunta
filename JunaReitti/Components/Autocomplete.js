import React, {Component} from "react";
import {TouchableOpacity, View, StyleSheet, Text} from "react-native";
import Autocomplete from 'react-native-autocomplete-input';
import { Icon } from "react-native-elements";

class AutoComplete extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            stationList: [],
            query: '',
            hideSuggestions: true,
            timeout: 0,
            myLocation: false
        };
    }

    inputHandler = (val, instant) => {
        clearTimeout(this.state.timeout);
        this.setState({
            query: val,
            myLocation: false,
            timeout: setTimeout(() => {
                this.props.userInput(this.props.name, val)
            }, instant ? 0 : 1000)
        })
    }

    hideSuggestions = () => {
        this.setState({
            hideSuggestions: true
        })
    }

    unhideSuggestions = () => {
        this.setState({
            hideSuggestions: false
        })
    }

    componentDidMount() {

        const tempL = [];

        this.props.stations.map((station) => {

            tempL.push(station.stationName);
        });

        this.setState({
            stationList: tempL
        })

    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location !== this.props.location && nextProps.location.length) {
            this.setState({
                query: nextProps.location,
                myLocation: true,
                hideSuggestions: true
            }, () => this.props.userInput(this.props.name, this.state.query));
        }
    }

    findStation(query) {
        if (query === '') {
            return [];
        }

        const { stationList } = this.state;
        const regex = new RegExp('^' + `${query.trim()}`, 'i');
        return stationList.filter(station => station.search(regex) >= 0);
    }

    render() {

        const { query } = this.state;
        const stations = this.findStation(query);
        const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

        let icon;
        if (this.state.myLocation) {
            icon = (<View style={styles.icon}><Icon name={'my-location'} size={20} color="#444" title="Oma Sijainti" /></View>)
        }

        return (
            <View style={{width: '50%'}}>
                <Autocomplete style={[styles.autocomplete, this.state.myLocation && styles.iconEnabled]}
                    autoCapitalize="none"
                    inputContainerStyle={styles.inputContainer}
                    underlineColorAndroid='transparent'
                    data={stations.length === 1 && comp(query, stations[0]) ? [] : stations}
                    defaultValue={query}
                    onChangeText={(query) => this.inputHandler(query, stations.length === 1)}
                    onBlur={this.hideSuggestions}
                    onFocus={this.unhideSuggestions}
                    hideResults={this.state.hideSuggestions}
                    onSubmitEditing={() => this.inputHandler(query, true)}
                    selectTextOnFocus={true}
                    disableFullscreenUI={true}
                    placeholder={this.props.placeholder}
                    renderItem={(data) => (
                        <TouchableOpacity onPress={() => {
                            this.inputHandler(data, true);
                            this.hideSuggestions();
                        }}>
                            <Text style={styles.itemText}>
                                {data}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
                {icon}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    itemText: {
        fontSize: 16,
        margin: 2,
        lineHeight: 30
    },
    inputContainer: {
        borderRightWidth: 0,
        borderLeftWidth: 0
    },
    icon: {
        position: 'absolute',
        top: 10,
        left: 3
    },
    autocomplete: {
        width: '100%',
        height: 40,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    iconEnabled: {
        paddingLeft: 30,
    }
});

export default AutoComplete;