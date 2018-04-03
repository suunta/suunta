import React, {Component} from "react";
// import {TextInput, View, StyleSheet, Text} from "react-native";
import AutoSuggest from 'react-native-autosuggest';

class Input extends React.Component {

    inputHandler = (val) => {
        this.props.userInput(this.props.name, val);
    };

    render() {
        return (
                <AutoSuggest
                    placeholder={this.props.placeholder}
                    onChangeText={this.inputHandler}
                    terms={['Pasila', 'Helsinki']}
                    containerStyles={{
                        width: '40%',
                        marginLeft: 10,
                        marginRight: 10
                    }}
                    otherTextInputProps={{ editable: true }}
                />
        );
    }

}
{/*<TextInput placeholder={this.props.placeholder} style={styles.inputField} onChangeText={this.inputHandler}/>*/}

{/*<AutoSuggest*/}
{/*placeholder={this.props.placeholder}*/}
{/*style={styles.inputField}*/}
{/*onChangeText={this.inputHandler}*/}
{/*terms={this.state.asemaLista}*/}
{/*/>*/}


export default Input;