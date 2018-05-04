import React, { Component } from 'react';
import { Button, ToastAndroid, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import geolib from 'geolib';
import Permissions from 'react-native-permissions';
import { Icon } from "react-native-elements";

export default class HaeAsemat extends Component {
    
    constructor(props) {
        super(props);

        this.state = {
            latitude: null,
            longitude: null,
            error: null,
            lahinAsema: '',
            index: 1
        }
    }

    getClosestStation = () => {
        console.log("Hakee asemia");
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log(position);
                i = 1;
                this.setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    index: 1
                },() => {
                    
                    let nykyinenSijainti = {"paikka": {latitude: this.state.latitude, longitude: this.state.longitude}}

                    //Haetaan asemien sijainnit ja formatoidaan ne oikeaan muotoon
                    let asemaSijainnit = {};
                    
                    for (var asema in this.props.asemat) {
                        let nimi = this.props.asemat[asema].stationName;
                        
                        asemaSijainnit[nimi] = {latitude: this.props.asemat[asema].latitude, longitude: this.props.asemat[asema].longitude}
                    }
                    
                    //Verrataan omaa sijaintia juna-asemien sijaintiin
                    let result = geolib.findNearest(nykyinenSijainti['paikka'], asemaSijainnit, 0);

                    console.log('Kutsutaan handleDeparttia parametrilla: ' + result.key);
                    // Tämä pitää muuttaa, jotta sijainti menee inputfieldiin this.handleDepartInput(result.key);
                    //this.props.input(result.key);
                    this.props.location(result.key);

                
                });
            },           
            (error) => {
                console.log(error); 
                
                this.setState(prevState => {
                   return { index: prevState.index + 1 }
                })
                console.log(this.state.index)
                
                if(this.state.index <= 4 && error.code == '3') {
                    this.getClosestStation()
                };
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
        );        
    };

    render() {

        return(
            <TouchableOpacity style={styles.getloc} onPress={requestPermission = () => {
                    Permissions.request('location', { type: 'whenInUse' }).then(response => {
                        // Returns once the user has chosen to 'allow' or to 'not allow' access
                        // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
                    // setLocationResponse={response};
                        this.getClosestStation()
                    })
                }}>
                <Icon
                    name={'location-on'}
                    size={22}
                    color="#222"
                    title="Sijainti"
                />
                <Text style={styles.omasijainti}>
                    Hae lähin
                </Text>
            </TouchableOpacity>
        )
    }
}
const styles = StyleSheet.create({
    omasijainti: {
        fontSize: 16,
        paddingLeft: 4
    },
    getloc: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#acacac',
        margin: 2,
        marginBottom: 9,
        paddingVertical: 9
    }
});