import React, {Component} from "react";
import {TextInput, View, StyleSheet, Text} from "react-native";

class Input extends React.Component {

    inputHandler = (val) => {
        this.props.userInput(val);
    };

    render() {
        return (
                <TextInput style={styles.inputField} onChangeText={this.inputHandler}/>
        );
    }

}

const styles = StyleSheet.create({
    inputField: {
        width: '40%',
        marginLeft: 10,
        marginRight: 10
    }
});

export default Input;