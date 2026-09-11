export = OAuth2App;
/**
 * @extends Homey.App
 * @type {module.OAuth2App}
 * @hideconstructor
 */
declare class OAuth2App {
    /** @type {boolean} */
    static OAUTH2_DEBUG: boolean;
    /** @type {OAuth2Client} */
    static OAUTH2_CLIENT: OAuth2Client;
    /** @type {boolean} */
    static OAUTH2_MULTI_SESSION: boolean;
    /**
     * We assume all drivers use OAuth2.
     * In some cases, some drivers may never become ready.
     * Make sure to exclude those drivers from this array.
     * @type {string[]}
     */
    static OAUTH2_DRIVERS: string[];
    /**
     * @returns {Promise<void>}
     */
    onInit(): Promise<void>;
    /**
     * @returns {Promise<void>}
     */
    onOAuth2Init(): Promise<void>;
    /**
     */
    enableOAuth2Debug(): void;
    /**
     */
    disableOAuth2Debug(): void;
    /**
     * Set the app's config.
     * Most apps will only use one config, `default`.
     * All methods default to this config.
     * For apps using multiple clients, a configId can be provided.
     * @param {object} args
     * @param {string} args.configId
     * @param {OAuth2Client} args.client
     * @param {string} args.clientId
     * @param {string} args.clientSecret
     * @param {string} args.apiUrl
     * @param {string} args.token
     * @param {string} args.tokenUrl
     * @param {string} args.authorizationUrl
     * @param {string} args.redirectUrl
     * @param {string[]} args.scopes
     * @param {boolean} args.allowMultiSession
     */
    setOAuth2Config({ configId, client, clientId, clientSecret, apiUrl, token, tokenUrl, authorizationUrl, redirectUrl, scopes, allowMultiSession, }?: {
        configId: string;
        client: OAuth2Client;
        clientId: string;
        clientSecret: string;
        apiUrl: string;
        token: string;
        tokenUrl: string;
        authorizationUrl: string;
        redirectUrl: string;
        scopes: string[];
        allowMultiSession: boolean;
    }): void;
    hasConfig({ configId, }?: {
        configId?: string;
    }): boolean;
    /**
     * @param {object} args
     * @param {string} args.configId
     */
    checkHasConfig({ configId, }?: {
        configId: string;
    }): boolean;
    /**
     * @param {object} args
     * @param {string} args.configId
     * @returns {string}
     */
    getConfig({ configId, }?: {
        configId: string;
    }): string;
    hasOAuth2Client({ sessionId, configId, }?: {
        sessionId: string;
        configId?: string;
    }): boolean;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     */
    checkHasOAuth2Client({ sessionId, configId, }?: {
        sessionId: string;
        configId: string;
    }): void;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     * @returns {OAuth2Client}
     */
    createOAuth2Client({ sessionId, configId, }?: {
        sessionId: string;
        configId: string;
    }): OAuth2Client;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     */
    deleteOAuth2Client({ sessionId, configId, }?: {
        sessionId: string;
        configId: string;
    }): void;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     * @returns {OAuth2Client}
     */
    getOAuth2Client({ sessionId, configId, }?: {
        sessionId: string;
        configId: string;
    }): OAuth2Client;
    /**
     * @param {object} args
     * @param {string} args.configId
     * @param {string} args.sessionId
     * @param {OAuth2Client} args.client
     */
    saveOAuth2Client({ configId, sessionId, client }: {
        configId: string;
        sessionId: string;
        client: OAuth2Client;
    }): void;
    /**
     * @returns {object}
     */
    getSavedOAuth2Sessions(): object;
    /**
     * @returns {OAuth2Client}
     */
    getFirstSavedOAuth2Client(): OAuth2Client;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     */
    tryCleanSession({ sessionId, configId, }: {
        sessionId: string;
        configId: string;
    }): void;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     * @returns {Promise<boolean>}
     */
    onShouldDeleteSession({ sessionId, configId, }: {
        sessionId: string;
        configId: string;
    }): Promise<boolean>;
    /**
     * @param {object} args
     * @param {string} args.sessionId
     * @param {string} args.configId
     * @returns {Promise<array>}
     */
    getOAuth2Devices({ sessionId, configId, }: {
        sessionId: string;
        configId: string;
    }): Promise<OAuth2Client[]>;
}
import OAuth2Client = require("./OAuth2Client");
