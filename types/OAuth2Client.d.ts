export = OAuth2Client;
/**
 * @extends EventEmitter
 * @description This class handles all api and token requests, and should be extended by the app.
 * @type {module.OAuth2Client}
 * @hideconstructor
 */
declare class OAuth2Client {
    /** @type {string[]} */
    static CLIENT_ID: string[];
    /** @type {string[]} */
    static CLIENT_SECRET: string[];
    /** @type {string} */
    static API_URL: string;
    /** @type {OAuth2Token} */
    static TOKEN: OAuth2Token;
    /** @type {string} */
    static TOKEN_URL: string;
    /** @type {string} */
    static AUTHORIZATION_URL: string;
    /** @type {string} */
    static REDIRECT_URL: string;
    /** @type {string[]} */
    static SCOPES: string[];
    /**
     * @param {object} args
     * @param {Homey} args.homey
     * @param {string} args.token
     * @param {string} args.clientId
     * @param {string} args.clientSecret
     * @param {string} args.apiUrl
     * @param {string} args.tokenUrl
     * @param {string} args.authorizationUrl
     * @param {string} args.redirectUrl
     * @param {array} args.scopes
     */
    constructor({ homey, token, clientId, clientSecret, apiUrl, tokenUrl, authorizationUrl, redirectUrl, scopes, }: {
        homey: Homey;
        token: string;
        clientId: string;
        clientSecret: string;
        apiUrl: string;
        tokenUrl: string;
        authorizationUrl: string;
        redirectUrl: string;
        scopes: string[];
    });
    homey: Homey;
    _tokenConstructor: string;
    _clientId: string;
    _clientSecret: string;
    _apiUrl: string;
    _tokenUrl: string;
    _authorizationUrl: string;
    _redirectUrl: string;
    _scopes: string[];
    _token: string;
    /**
     * @description Helper function
     * @returns {Promise<void>}
     */
    init(): Promise<void>;
    /**
     * @description Helper function
     * @param props
     */
    log(...props: any[]): void;
    /**
     * @description Helper function
     * @param props
     */
    error(...props: any[]): void;
    /**
     * @description Helper function
     * @param props
     */
    debug(...props: any[]): void;
    /**
     * @description Helper function
     */
    save(): void;
    /**
     * @description Helper function
     */
    destroy(): void;
    /**
     * @param {object} args
     * @param {string} args.path
     * @param {string} args.query
     * @param {object} args.headers
     * @returns {Promise<*>}
     */
    get({ path, query, headers, }: {
        path: string;
        query: string;
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @param {object} args
     * @param {string} args.path
     * @param {string} args.query
     * @param {object} args.headers
     * @returns {Promise<*>}
     */
    delete({ path, query, headers, }: {
        path: string;
        query: string;
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @param {object} args
     * @param {string} args.path
     * @param {string} args.query
     * @param {object} args.json
     * @param {object} args.body
     * @param {object} args.headers
     * @returns {Promise<*>}
     */
    post({ path, query, json, body, headers, }: {
        path: string;
        query: string;
        json: object;
        body: object;
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @param {object} args
     * @param {string} args.path
     * @param {string} args.query
     * @param {object} args.json
     * @param {object} args.body
     * @param {object} args.headers
     * @returns {Promise<*>}
     */
    patch({ path, query, json, body, headers, }: {
        path: string;
        query: string;
        json: object;
        body: object;
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @param {object} args
     * @param {string} args.path
     * @param {string} args.query
     * @param {object} args.json
     * @param {object} args.body
     * @param {object} args.headers
     * @returns {Promise<*>}
     */
    put({ path, query, json, body, headers, }: {
        path: string;
        query: string;
        json: object;
        body: object;
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @param {object} args
     * @returns {Promise<undefined|void|null>}
     */
    refreshToken(args: object): Promise<undefined | void | null>;
    _refreshingToken: Promise<OAuth2Token>;
    /**
     * @param {object} args
     * @param args.req
     * @param {boolean} args.didRefreshToken
     * @returns {Promise<void|*>}
     * @private
     */
    private _executeRequest;
    /**
     * @param {object} args
     * @param {string} args.code
     * @returns {Promise<null>}
     */
    getTokenByCode({ code }: {
        code: string;
    }): Promise<null>;
    /**
     * @param {object} args
     * @param {string} args.username
     * @param {string} args.password
     * @returns {Promise<null>}
     */
    getTokenByCredentials({ username, password }: {
        username: string;
        password: string;
    }): Promise<null>;
    /**
     * @returns {string|null}
     */
    getToken(): string | null;
    /**
     * @param {object} args
     * @param {string} args.token
     */
    setToken({ token }: {
        token: string;
    }): void;
    /**
     * @param {object} args
     * @param {array} args.scopes
     * @param {string} args.state
     * @returns {string}
     */
    getAuthorizationUrl({ scopes, state, }?: {
        scopes: string[];
        state: string;
    }): string;
    /**
     * @returns {string}
     */
    getTitle(): string;
    /**
     * @param {string} title
     */
    setTitle(title: string): void;
    _title: string;
    /**
     * @description Can be extended
     * @returns {Promise<void>}
     */
    onInit(): Promise<void>;
    /**
     * @description Can be extended
     * @returns {Promise<void>}
     */
    onUninit(): Promise<void>;
    /**
     * @description Can be extended
     * @param {object} args
     * @param {string} args.method
     * @param {string} args.path
     * @param {object} args.json
     * @param {object} args.body
     * @param {object} args.query
     * @param {object} args.headers
     * @returns {Promise<{opts: object, url: string}>}
     */
    onBuildRequest({ method, path, json, body, query, headers, }: {
        method: string;
        path: string;
        json: object;
        body: object;
        query: object;
        headers: Record<string, string>;
    }): Promise<{
        opts: object;
        url: string;
    }>;
    /**
     * @description Can be extended
     * @param {object} args
     * @param {string} args.query
     * @returns {Promise<Object>}
     */
    onRequestQuery({ query }: {
        query: string;
    }): Promise<any>;
    /**
     * @param {object} args
     * @param {object} args.headers
     * @returns {Promise<Object>}
     */
    onRequestHeaders({ headers }: {
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @description Can be extended
     * @description {@link https://tools.ietf.org/html/rfc6749#section-4.1.3}
     * @param {object} args
     * @param {string} args.code
     * @returns {Promise<OAuth2Token>}
     */
    onGetTokenByCode({ code }: {
        code: string;
    }): Promise<OAuth2Token>;
    /**
     * @description Can be extended
     * @param {object} args
     * @param {object} args.response
     * @returns {Promise<void>}
     */
    onHandleGetTokenByCodeError({ response }: {
        response: object;
    }): Promise<void>;
    /**
     * @description Can be extended
     * @param {object} args
     * @param {object} args.response
     * @returns {Promise<void>}
     */
    onHandleGetTokenByCodeResponse({ response }: {
        response: object;
    }): Promise<void>;
    /**
     * @description {@link https://tools.ietf.org/html/rfc6749#section-4.3.2}
     * @param {object} args
     * @param {string} args.username
     * @param {string} args.password
     * @returns {Promise<OAuth2Token>}
     */
    onGetTokenByCredentials({ username, password }: {
        username: string;
        password: string;
    }): Promise<OAuth2Token>;
    onHandleGetTokenByCredentialsError({ response }: {
        response: any;
    }): Promise<void>;
    onHandleGetTokenByCredentialsResponse({ response }: {
        response: any;
    }): Promise<any>;
    /**
     * @description {@link https://tools.ietf.org/html/rfc6749#section-6}
     * @returns {Promise<OAuth2Token>}
     */
    onRefreshToken(): Promise<OAuth2Token>;
    /**
     * @param {object} args
     * @param {object} args.response
     * @returns {Promise<void>}
     */
    onHandleRefreshTokenError({ response }: {
        response: object;
    }): Promise<void>;
    /**
     * @param {object} args
     * @param {object} args.response
     * @returns {Promise<OAuth2Token>}
     */
    onHandleRefreshTokenResponse({ response }: {
        response: object;
    }): Promise<OAuth2Token>;
    /**
     * @param {object} args
     * @param args.response
     * @returns {Promise<void>}
     * @private
     */
    private _onHandleGetTokenByErrorGeneric;
    /**
     * @param response
     * @returns {Promise<*>}
     * @private
     */
    private _onHandleGetTokenByResponseGeneric;
    /**
     * @param {object} arg
     * @param {object} arg.err
     * @returns {Promise<void>}
     */
    onRequestError({ err }: {
        err: object;
    }): Promise<void>;
    /**
     * @description This method returns a boolean if the response is rate limited
     * @param {object} args
     * @param args.req
     * @param {string} args.url
     * @param {object} args.opts
     * @param args.response
     * @param args.didRefreshToken
     * @returns {Promise<void|*>}
     */
    onRequestResponse({ req, url, opts, response, didRefreshToken, }: {
        req: any;
        url: string;
        opts: object;
        response: any;
        didRefreshToken: boolean;
    }): Promise<void | any>;
    /**
     * @description This method returns a boolean if the token should be refreshed
     * @param {object} args
     * @param {number} args.status
     * @returns {Promise<boolean>}
     */
    onShouldRefreshToken({ status }: {
        status: number;
    }): Promise<boolean>;
    /**
     * @description This method returns a boolean if the response is rate limited
     * @param {object} args
     * @param {number} args.status
     * @param {object} args.headers
     * @returns {Promise<boolean>}
     */
    onIsRateLimited({ status, headers }: {
        status: number;
        headers: Record<string, string>;
    }): Promise<boolean>;
    /**
     * @description This method handles a response and downloads the body
     * @param {object} args
     * @param {object} args.response
     * @param {number} args.status
     * @param {string} args.statusText
     * @param {object} args.headers
     * @param {boolean} args.ok
     * @returns {Promise<*|undefined>}
     */
    onHandleResponse({ response, status, statusText, headers, ok, }: {
        response: object;
        status: number;
        statusText: string;
        headers: Record<string, string>;
        ok: boolean;
    }): Promise<any | undefined>;
    /**
     * @description This method handles a response that is not OK (400 <= statuscode <= 599)
     * @param {object} args
     * @param args.body
     * @param {number} args.status
     * @param {string} args.statusText
     * @param {object} args.headers
     * @returns {Promise<Error>}
     */
    onHandleNotOK({ body, status, statusText, headers, }: {
        body: any;
        status: number;
        statusText: string;
        headers: Record<string, string>;
    }): Promise<Error>;
    /**
     * @description This method handles a response that is OK
     * @param {object} args
     * @param args.result
     * @param {number} args.status
     * @param {string} args.statusText
     * @param {object} args.headers
     * @returns {Promise<*>}
     */
    onHandleResult({ result, status, statusText, headers, }: {
        result: any;
        status: number;
        statusText: string;
        headers: Record<string, string>;
    }): Promise<any>;
    /**
     * @param {object} args
     * @param {array.<string>} args.scopes
     * @param {string} args.state
     * @returns {string}
     */
    onHandleAuthorizationURL({ scopes, state }?: {
        scopes: string[];
        state: string;
    }): string;
    /**
     * @description {@link https://tools.ietf.org/html/rfc6749#appendix-A.4}
     * @param {object} args
     * @param {array} args.scopes
     * @returns {*}
     */
    onHandleAuthorizationURLScopes({ scopes }: {
        scopes: string[];
    }): string | undefined; /// Assuming string since it uses .join()
    /**
     * @description This method returns data that can identify the session
     * @returns {Promise<{id: *, title: null}>}
     */
    onGetOAuth2SessionInformation(): Promise<{
        id: string;
        title: null;
    }>;
}
import OAuth2Token = require("./OAuth2Token");
