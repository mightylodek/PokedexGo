"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionRunStatus = exports.FriendshipStatus = exports.AssetPurpose = exports.AssetKind = exports.LearnMethod = exports.MoveCategory = void 0;
var MoveCategory;
(function (MoveCategory) {
    MoveCategory["FAST"] = "FAST";
    MoveCategory["CHARGED"] = "CHARGED";
})(MoveCategory || (exports.MoveCategory = MoveCategory = {}));
var LearnMethod;
(function (LearnMethod) {
    LearnMethod["FAST"] = "FAST";
    LearnMethod["CHARGED"] = "CHARGED";
    LearnMethod["ELITE_FAST"] = "ELITE_FAST";
    LearnMethod["ELITE_CHARGED"] = "ELITE_CHARGED";
    LearnMethod["LEGACY"] = "LEGACY";
})(LearnMethod || (exports.LearnMethod = LearnMethod = {}));
var AssetKind;
(function (AssetKind) {
    AssetKind["SPRITE_STATIC"] = "SPRITE_STATIC";
    AssetKind["SPRITE_ANIMATED"] = "SPRITE_ANIMATED";
    AssetKind["ICON"] = "ICON";
})(AssetKind || (exports.AssetKind = AssetKind = {}));
var AssetPurpose;
(function (AssetPurpose) {
    AssetPurpose["THUMBNAIL"] = "THUMBNAIL";
    AssetPurpose["DETAIL"] = "DETAIL";
    AssetPurpose["ANIMATED"] = "ANIMATED";
})(AssetPurpose || (exports.AssetPurpose = AssetPurpose = {}));
var FriendshipStatus;
(function (FriendshipStatus) {
    FriendshipStatus["PENDING"] = "PENDING";
    FriendshipStatus["ACCEPTED"] = "ACCEPTED";
    FriendshipStatus["BLOCKED"] = "BLOCKED";
})(FriendshipStatus || (exports.FriendshipStatus = FriendshipStatus = {}));
var IngestionRunStatus;
(function (IngestionRunStatus) {
    IngestionRunStatus["PENDING"] = "PENDING";
    IngestionRunStatus["RUNNING"] = "RUNNING";
    IngestionRunStatus["SUCCESS"] = "SUCCESS";
    IngestionRunStatus["FAILED"] = "FAILED";
})(IngestionRunStatus || (exports.IngestionRunStatus = IngestionRunStatus = {}));
//# sourceMappingURL=enums.js.map