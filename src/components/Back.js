import React from 'react-native';

var {
  Text,
  TouchableHighlight,
  StyleSheet,
} = React;

var Back = React.createClass ({
  render() {
      return (
        <TouchableHighlight
          onPress={() => this.props.navigator.jumpBack()}>
          <Text style={styles.link}>back</Text>
        </TouchableHighlight>
      )
    }
})

var styles = StyleSheet.create({
  link: {
    color: 'blue',
  }
});

module.exports = Back;
