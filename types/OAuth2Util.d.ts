export = OAuth2Util;
/**
 * @type {module.OAuth2Util}
 * @hideconstructor
 */
declare class OAuth2Util {
    /**
     * @returns {string}
     */
    static getRandomId(): string;
    /**
     * @param {number} delay
     * @returns {Promise<void>}
     */
    static wait(delay?: number): Promise<void>;
}
