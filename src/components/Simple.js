import React from 'react-native';
import Relay from 'react-relay';
import Back from './Back';

var {
  View,
  Text,
  StyleSheet,
} = React;

var Simple = React.createClass ({

  render() {
      return (
        <View style={styles.view}>
          <Text>Viewer ID: {this.props.viewer.id}</Text>
          <Back navigator={this.props.navigator}/>
        </View>
    );
  }
});

export default Relay.createContainer(Simple, {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
