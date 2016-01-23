/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayGarbageCollector
 * 
 * @typechecks
 */

'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var GraphQLRange = require('./GraphQLRange');
var GraphQLStoreDataHandler = require('./GraphQLStoreDataHandler');

var RelayQueryPath = require('./RelayQueryPath');

var forEachObject = require('fbjs/lib/forEachObject');
var invariant = require('fbjs/lib/invariant');

/**
 * @internal
 *
 * Provides methods to track the number of references to registered records and
 * remove un-referenced records from Relay's cache.
 */

var RelayGarbageCollector = (function () {
  function RelayGarbageCollector(storeData, scheduler) {
    _classCallCheck(this, RelayGarbageCollector);

    this._activeHoldCount = 0;
    this._collectionQueue = [];
    this._isCollecting = false;
    this._refCounts = {};
    this._scheduler = scheduler;
    this._storeData = storeData;
  }

  RelayGarbageCollector.prototype.register = function register(dataID) {
    if (!this._refCounts.hasOwnProperty(dataID)) {
      this._refCounts[dataID] = 0;
    }
  };

  RelayGarbageCollector.prototype.incrementReferenceCount = function incrementReferenceCount(dataID) {
    !this._refCounts.hasOwnProperty(dataID) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayGarbageCollector: must register `%s` before referencing.', dataID) : invariant(false) : undefined;
    this._refCounts[dataID]++;
  };

  RelayGarbageCollector.prototype.decrementReferenceCount = function decrementReferenceCount(dataID) {
    !this._refCounts.hasOwnProperty(dataID) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayGarbageCollector: must register `%s` before dereferencing.', dataID) : invariant(false) : undefined;
    !(this._refCounts[dataID] > 0) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayGarbageCollector: cannot decrease references below zero for `%s`.', dataID) : invariant(false) : undefined;
    this._refCounts[dataID]--;
  };

  /**
   * Notify the collector that GC should be put on hold/paused. The hold can be
   * released by calling the returned callback.
   *
   * Example use cases:
   * - In-flight queries may have been diffed against cached records that are
   *   unreferenced and eligible for GC. If these records were collected there
   *   would be insufficient data in the cache to render.
   * - There may be a gap between a query response being processed and rendering
   *   the component that initiated the fetch. If records were collected there
   *   would be insufficient data in the cache to render.
   */

  RelayGarbageCollector.prototype.acquireHold = function acquireHold() {
    var _this = this;

    var isReleased = false;
    this._activeHoldCount++;
    return {
      release: function release() {
        !!isReleased ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayGarbageCollector: hold can only be released once.') : invariant(false) : undefined;
        !(_this._activeHoldCount > 0) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayGarbageCollector: cannot decrease hold count below zero.') : invariant(false) : undefined;
        isReleased = true;
        _this._activeHoldCount--;
        if (_this._activeHoldCount === 0) {
          _this._scheduleCollection();
        }
      }
    };
  };

  /**
   * Schedules a collection starting at the given record.
   */

  RelayGarbageCollector.prototype.collectFromNode = function collectFromNode(dataID) {
    if (this._refCounts[dataID] === 0) {
      this._collectionQueue.push(dataID);
      this._scheduleCollection();
    }
  };

  /**
   * Schedules a collection for any currently unreferenced records.
   */

  RelayGarbageCollector.prototype.collect = function collect() {
    var _this2 = this;

    forEachObject(this._refCounts, function (refCount, dataID) {
      if (refCount === 0) {
        _this2._collectionQueue.push(dataID);
      }
    });
    this._scheduleCollection();
  };

  RelayGarbageCollector.prototype._scheduleCollection = function _scheduleCollection() {
    var _this3 = this;

    if (this._isCollecting || this._activeHoldCount || !this._collectionQueue.length) {
      // already scheduled, active hold, or nothing to do
      return;
    }
    this._isCollecting = true;

    var cachedRecords = this._storeData.getCachedData();
    var freshRecords = this._storeData.getNodeData();
    this._scheduler(function () {
      // handle async scheduling
      if (_this3._activeHoldCount || !_this3._collectionQueue.length) {
        return _this3._isCollecting = false;
      }

      var dataID = undefined;
      var refCount = undefined;
      // find the next record to collect
      do {
        dataID = _this3._collectionQueue.shift();
        refCount = _this3._refCounts[dataID];
      } while (dataID && refCount === undefined || refCount > 0);
      var cachedRecord = cachedRecords[dataID];
      if (cachedRecord) {
        _this3._traverseRecord(cachedRecord);
      }
      var freshRecord = freshRecords[dataID];
      if (freshRecord) {
        _this3._traverseRecord(freshRecord);
      }
      _this3._collectRecord(dataID);

      // only allow new collections to be scheduled once the current one
      // is complete
      return _this3._isCollecting = !!_this3._collectionQueue.length;
    });
  };

  RelayGarbageCollector.prototype._traverseRecord = function _traverseRecord(record) {
    var _this4 = this;

    forEachObject(record, function (value, storageKey) {
      if (value instanceof RelayQueryPath) {
        return;
      } else if (value instanceof GraphQLRange) {
        value.getEdgeIDs().forEach(function (id) {
          return _this4._collectionQueue.push(id);
        });
      } else if (Array.isArray(value)) {
        value.forEach(function (item) {
          if (typeof item === 'object' && item !== null) {
            var linkedID = GraphQLStoreDataHandler.getID(item);
            if (linkedID) {
              _this4._collectionQueue.push(linkedID);
            }
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        var linkedID = GraphQLStoreDataHandler.getID(value);
        if (linkedID) {
          _this4._collectionQueue.push(linkedID);
        }
      }
    });
  };

  RelayGarbageCollector.prototype._collectRecord = function _collectRecord(dataID) {
    this._storeData.getQueryTracker().untrackNodesForID(dataID);
    this._storeData.getQueuedStore().removeRecord(dataID);
    this._storeData.getRangeData().removeRecord(dataID);
    delete this._refCounts[dataID];
  };

  return RelayGarbageCollector;
})();

module.exports = RelayGarbageCollector;