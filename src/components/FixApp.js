import React from 'react-native';
import Relay from 'react-relay';
import Simple from './Simple';
import Collection from './Collection';

var {
  Navigator,
  TouchableHighlight,
  StyleSheet,
  BackAndroid,
  Text,
  View,
} = React;

var _navigator;
BackAndroid.addEventListener('hardwareBackPress', () => {
  if (_navigator && _navigator.getCurrentRoutes().length > 1) {
    _navigator.pop();
    return true;
  }
  return false;
});


var FixApp = React.createClass({
  renderScene(route, navigator) {
    _navigator = navigator;
    switch (route.id) {
      case 'Simple':
        return (
          <Simple
            viewer={this.props.viewer}
            navigator={navigator}
          />
        )
      case 'Collection':
        return (
          <Collection
            viewer={this.props.viewer}
            navigator={navigator}
          />
        )
      default:
        return (
          <View style={styles.view}>
            <TouchableHighlight onPress={() => _navigator.push({id: 'Simple'})}>
              <Text style={styles.link}>Simple Example</Text>
            </TouchableHighlight>
            <TouchableHighlight onPress={() => _navigator.push({id: 'Collection'})}>
              <Text style={styles.link}>Collection Example</Text>
            </TouchableHighlight>
          </View>
        )
    }
  },

  render() {
    return (
      <Navigator
        initialRoute={{ id: '' }}
        renderScene={this.renderScene}
        configureScene={(route) => {
          if (route.sceneConfig) {
            return route.sceneConfig;
          }
          return Navigator.SceneConfigs.FloatFromBottom;
        }}
      />
    );
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

var styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    color: 'blue',
  },
});
