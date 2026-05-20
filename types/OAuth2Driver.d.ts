export = OAuth2Driver;
/**
 * @class OAuth2Driver
 * @extends Homey.Driver
 * @type {module.OAuth2Driver}
 * @hideconstructor
 */
declare class OAuth2Driver {
    static OAUTH2_CONFIG_ID: string;
    /**
     * @returns {Promise<void>}
     */
    onInit(): Promise<void>;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<void>}
     */
    onOAuth2Init(): Promise<void>;
    /**
     * @returns {*}
     */
    getOAuth2ConfigId(): string | undefined; /// Assuming id is a string
    /**
     * @param {string} id
     */
    setOAuth2ConfigId(id: string): void;
    /**
     * @param {PairSession} socket
     */
    onPair(socket: PairSession): void;
    /**
     * @description
     * > This method can be extended
     * @returns {Promise<*>}
     */
    onPairListDevices(): Promise<Array<any>>; /// This should always return an array?
    /**
     * @param {PairSession} socket
     * @param {Homey.Device} device
     */
    onRepair(socket: PairSession, device: Homey.Device): void;
}
