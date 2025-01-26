export = OAuth2Token;
/**
 * @type {module.OAuth2Token}
 */
declare class OAuth2Token {
    /**
     * @param {object} args
     * @param args.access_token
     * @param args.refresh_token
     * @param args.token_type
     * @param args.expires_in
     */
    constructor({ access_token, refresh_token, token_type, expires_in, }: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    });
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    /**
     * @returns {boolean}
     */
    isRefreshable(): boolean;
    /**
     * @returns {
     *  {access_token: (*|null), refresh_token: (*|null), token_type: (*|null), expires_in: (*|null)}
     * }
     */

    /// Setting to undefined but can be changed to null?
    toJSON(): {
        access_token: string | undefined;
        refresh_token: string | undefined;
        token_type: string | undefined;
        expires_in: number | undefined;
    };
}
