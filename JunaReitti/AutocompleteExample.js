import Autocomplete from 'react-native-autocomplete-input';
import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


class AutocompleteExample extends Component {
    constructor(props) {
        super(props);
        this.state = {
            asemat: [],
            query: ''
        };
    }

    componentDidMount() {
        fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
            .then((response) => response.json())
            .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
            .then(asemat => asemat.map(asema => {
                    return {
                        id: asema.stationUICCode,
                        stationShortCode: asema.stationShortCode,
                        stationName: asema.stationName,
                        passengerTraffic: asema.passengerTraffic
                    }
                })
            ).then(asemat => this.setState({asemat: asemat}))
    }

    etsiAsema(query) {
        if (query === '') {
            return [];
        }

        const { asemat } = this.state;
        const regex = new RegExp(`${query.trim()}`, 'i');
        return asemat.filter(asema => asema.stationName.search(regex) >= 0);
    }

    render() {
        const { query } = this.state;
        const films = this.etsiAsema(query);
        const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

        return (
            <View style={styles.container}>
                <Autocomplete
                    autoCapitalize="none"
                    autoCorrect={false}
                    containerStyle={styles.autocompleteContainer}
                    data={films.length === 1 && comp(query, films[0].stationName) ? [] : films}
                    defaultValue={query}
                    onChangeText={text => this.setState({ query: text })}
                    placeholder="Asema"
                    renderItem={({ stationName }) => (
                        <TouchableOpacity onPress={() => this.setState({ query: stationName })}>
                            <Text style={styles.itemText}>
                                {stationName}
                            </Text>
                        </TouchableOpacity>
                    )}
                />

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    autocompleteContainer: {
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 100
    },
    itemText: {
        fontSize: 15,
        margin: 2
    }
});

export default AutocompleteExample;
