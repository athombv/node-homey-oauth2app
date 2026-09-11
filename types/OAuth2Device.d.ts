export = OAuth2Device;
/**
 * @class OAuth2Device
 * @extends Homey.Device
 * @type {module.OAuth2Device}
 * @hideconstructor
 */
declare class OAuth2Device {
    /**
     */
    onInit(): Promise<void>;
    oAuth2Client: OAuth2Client;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Init(): Promise<void>;
    /**
     * @returns {Promise<void>}
     */
    onUninit(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Uninit(): Promise<void>;
    /**
     * @returns {Promise<void>}
     */
    onAdded(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Added(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Saved(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Destroyed(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Expired(): Promise<void>;
    /**
     * @returns {Promise<void>}
     */
    onDeleted(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Deleted(): Promise<void>;
}
import OAuth2Client = require("./OAuth2Client");