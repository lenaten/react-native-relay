import React from 'react-native';
import Relay from 'react-relay';

var {
  StyleSheet,
  Text,
  View,
} = React;

var FixApp = React.createClass({
  render() {
    return (
        <View style={styles.view}>
          <Text>Viewer ID: {this.props.viewer.id}</Text>
        </View>
    )
  }
});

export default Relay.createContainer(FixApp, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        id
      }
    `,
  },
});

var styles = StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
