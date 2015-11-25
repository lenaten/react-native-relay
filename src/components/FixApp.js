import React from 'react-native';
import Relay from 'react-relay';
import Simple from './Simple';
import Collection from './Collection';

var {
  View,
} = React;

var FixApp = React.createClass({
  render() {
    return (
        <View>
          <Simple
            viewer={this.props.viewer}
          />
          <Collection
            viewer={this.props.viewer}
          />
        </View>
    )
  }
});

export default Relay.createContainer(FixApp, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        ${Simple.getFragment('viewer')},
        ${Collection.getFragment('viewer')},
      }
    `,
  },
});
