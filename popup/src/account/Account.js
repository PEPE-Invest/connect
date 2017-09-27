/* @flow */

import { renderAccountDiscovery } from '../view/discovery';


const HD_HARDENED = 0x80000000;

export const getPathForIndex = (bip44purpose: number, bip44cointype: number, index: number): Array<number> => {
    return [
        (bip44purpose | HD_HARDENED) >>> 0,
        (bip44cointype | HD_HARDENED) >>> 0,
        (index | HD_HARDENED) >>> 0
    ];
}

export const discoverAllAccounts = (device, bitcoreBackend, limit) => {
    let accounts = [];
    const discover = (i) => {
        return Account.fromIndex(device, bitcoreBackend, i)
        .then((account) => {
            return account.discover().then(discovered => {
                accounts.push(discovered);
                if (discovered.info.transactions.length > 0) {
                    
                    if (i + 1 >= limit) {
                        return accounts; // stop at limit
                    }
                    return discover(i + 1);
                } else {
                    return accounts;
                }
            });
        });
    }
    return discover(0, limit);
}

export const discover = (device, backend, limit) => {
    const accounts = [];
    const inside = (i) => {
        Account.fromIndex(device, backend, i)
        .then(account => {
            account.discover().then(discovered => {
                accounts.push(discovered);
                renderAccountDiscovery(accounts, null);
                if (discovered.info.transactions.length > 0) {
                    return inside(i + 1);
                } else {
                    console.log("ALL LOADED!", backend.coinInfo.segwit)
                    if (backend.coinInfo.segwit) {
                        backend.coinInfo.segwit = false;
                        inside(0);
                    } else {
                        return accounts;
                    }
                }
            });
        });
    }
    inside(0);
}


export default class Account {

    static fromIndex(device, backend, id): Account {
        const coinInfo = backend.coinInfo;
        const path: Array<number> = getPathForIndex(coinInfo.segwit ? 49 : 44, coinInfo.bip44, id);
        return device.session.getHDNode(path, coinInfo.network).then(
            node => new Account(id, path, node.toBase58(), backend)
        );
    }

    id: number;
    basePath: Array<number>;
    xpub: string;
    backend: Object;
    info: Object;

    constructor(
        id: number,
        path: Array<number>,
        xpub: string,
        backend
    ) {
        this.id = id;
        this.basePath = path;
        this.xpub = xpub;
        this.backend = backend;
    }

    discover() {
        return this.backend.loadAccountInfo(
                this.xpub,
                null,
                () => { },
                (disposer) => { },
                this.backend.coinInfo.segwit
            ).then(
                (info) => {
                    this.info = info;
                    return this;
                },
                (error) => {
                    console.error('[account] Account loading error', error);
                }
            );
    }

    isUsed() {
        console.log("isUsed", this.info);
        return (this.info.transactions.length > 0);
    }

    getBalance() {
        console.log("getBalance", this.info);
        return this.info.balance;
    }
}