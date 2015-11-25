import React from 'react-native';
import Relay from 'react-relay';

var {
  View,
  Text,
} = React;

var Simple = React.createClass ({

  render() {
      return (
        <View>
          <Text>Simple Example</Text>
          <Text>Viewer ID: {this.props.viewer.id}</Text>
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
