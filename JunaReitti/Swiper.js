import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Input from "./Components/Input";
import sortBy from "lodash/sortBy";
import Swiper from 'react-native-swiper';
import JunaReitti from './JunaReitti.js';

default class Swiper extends Component<{}> {

    constructor(props) {
        super(props);

        this.state = {
            AsemaVali: []
        };
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
                <Swiper style={styles.wrapper} showsButtons={false}>
                    <View style1={{flex: 1, paddingTop: 0}}>
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
                                data = {sortBy(this.state.data, 'lahtoPvm').filter(juna => juna.matkaAika < this.state.minimiAika*2.1)}
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
                    <View style2={{flex: 1, paddingTop: 0}}>
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
                                data = {sortBy(this.state.data, 'lahtoPvm').filter(juna => juna.matkaAika < this.state.minimiAika*2.1)}
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
                </Swiper>
            );
        }
}