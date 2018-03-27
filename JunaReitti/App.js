import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Swiper from 'react-native-swiper';
import JunaReitti from './JunaReitti';

export default class App extends Component<{}> {

    constructor(props) {
        super(props);

        this.state = {
            asemaVali: []
        };
    }
    
    render() {

            

            return (
                <Swiper showsButtons={false}>
                    <JunaReitti lahtoasema="HKI" tuloasema="PSL" />
                    <JunaReitti lahtoasema="PSL" tuloasema="HKI" />
                </Swiper>
            );
        }
}