import React, {Component} from "react";
import {TouchableOpacity, View, StyleSheet, Text, Keyboard, Dimensions} from "react-native";
import Autocomplete from 'react-native-autocomplete-input';
import { Icon } from "react-native-elements";
import HaeAsemat from './HaeAsemat';

class AutoComplete extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            stationList: [],
            query: '',
            hideSuggestions: true,
            timeout: 0,
            myLocation: false,
            listHeight: Dimensions.get('window').height - 72
        };
    }

    inputHandler = (val, instant) => {
        if (val.length < this.state.query.length) {
            this.unhideSuggestions();
        }
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
        this.setState({
            stationList: this.props.stations.map(station => station.stationName)
        })
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
    }

    findStation(query) {
        if (query === '') {
            let mostUsedStations = this.props.stations.reduce((result, station) => {
                if (station.used > 0 && station.stationName !== this.props.lahto) {
                    result.push({n: station.stationName, u: station.used});
                }
                return result;
            }, [])
                .sort((a, b) => b.u - a.u)
                .map(asema => asema.n);
            if (this.props.name === "lahto") {
                mostUsedStations.unshift("Oma sijainti");
            }
            return mostUsedStations.slice(0,5);
        }

        const { stationList } = this.state;
        const regex = new RegExp('^' + `${query.trim()}`, 'i');
        return stationList.filter(station => station.search(regex) >= 0);
    }

    setLocation = (location) => {
        console.log('lokaatiosetloc');
        console.log(location);
        this.setState({
            query: location,
            myLocation: true,
            hideSuggestions: true
        }, () => this.props.userInput(this.props.name, this.state.query));
    }

    componentWillUnmount () {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    _keyboardDidShow =  (e) => {
        const keyboardHeight = e.endCoordinates.height;
        const listHeight = Dimensions.get('window').height - keyboardHeight - 72;
        this.setState({listHeight: listHeight});
    }

    _keyboardDidHide = (e) => {
        const listHeight = Dimensions.get('window').height - 72;
        this.setState({listHeight: listHeight});
    }

    handleSelectionChange = (event) => {
        const selection = event.nativeEvent.selection;
        const selectionLength = selection.end - selection.start;
        const inputLength = this.state.query.length;
        this.setState({selected: selectionLength > 0 && selectionLength === inputLength});
    }

    render() {
        const { query } = this.state;
        const stations = this.findStation(query);
        const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

        let myLocIcon;
        if (this.state.myLocation) {
            myLocIcon = (<View style={styles.myLocIcon}><Icon name={'my-location'} size={20} color="#444" title="Oma Sijainti" /></View>)
        }
        let clearIcon;
        if (!this.state.hideSuggestions && this.state.selected) {
            clearIcon = (<TouchableOpacity style={styles.clearIcon} onPress={() => this.inputHandler('', true)}>
                            <Icon name={'clear'} size={26} color="#444" title="Tyhjennä" />
                        </TouchableOpacity>)
        }

        return (
            <View style={{width: '50%'}}>
                <Autocomplete style={[
                         styles.autocomplete,
                         myLocIcon && styles.myLocIconEnabled,
                         clearIcon && styles.clearIconEnabled]}
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
                    autoFocus={this.props.name === "lahto"}
                    listStyle={{ maxHeight: this.state.listHeight}}
                    onSelectionChange={this.handleSelectionChange}
                    renderItem={(data) => (
                        data === 'Oma sijainti'
                        ? (<HaeAsemat asemat={this.props.stations} location={this.setLocation} setLocationPermission={this.props.setLocationPermission} />)
                        : (<TouchableOpacity onPress={() => {
                                this.inputHandler(data, true);
                                this.hideSuggestions();
                            }}>
                            <Text style={styles.itemText}>
                                {data}
                            </Text>
                        </TouchableOpacity> )
                    )}
                />
                {myLocIcon}
                {clearIcon}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    itemText: {
        fontSize: 16,
        margin: 2,
        lineHeight: 36
    },
    inputContainer: {
        borderRightWidth: 0,
        borderLeftWidth: 0
    },
    myLocIcon: {
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
    myLocIconEnabled: {
        paddingLeft: 30,
    },
    clearIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 9
    },
    clearIconEnabled: {
        paddingRight: 50,
    }
});
export default AutoComplete;