/* @flow */
'use strict';

import React from 'react-native';
import Relay from 'react-relay';
import FixApp from './src/components/FixApp';
import ViewerRoute from './src/routes/ViewerRoute';
import config from './config';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer(config.graphqlURL)
);

var {
  AppRegistry,
} = React;

class fix extends React.Component {
  render() {
    var viewerRoute = new ViewerRoute();
    return (
        <Relay.RootContainer
           Component={FixApp}
           route={viewerRoute}
        />
    );
  }
}

AppRegistry.registerComponent('fix', () => fix);
