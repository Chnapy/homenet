export const isPublicSafeMode = () => Boolean(process.env.PUBLIC_SAFE_MODE);

export const anonymizeIfNeeded = <D>(data: D, root = true): D => {
    try {
        if (!isPublicSafeMode()) {
            return data;
        }

        if (!data) {
            return data;
        }

        if (typeof data === 'string') {
            return anonymizeString(data) as D;
        }

        if (Array.isArray(data)) {
            return data.map(v => anonymizeIfNeeded(v, false)) as D;
        }

        if (typeof data === 'object') {
            return Object.fromEntries(
                Object.entries(data).map(([ key, value ]) => [ anonymizeString(key), anonymizeIfNeeded(value, false) ])
            ) as D;
        }
    }
    finally {

        // if (root) {
        //     console.log('VALUES FOUND =', values);
        //     values.clear();
        // }
    }

    return data;
}

const values = new Set<string>();

const fakeGlobalIPs = [
    '172.14.148.208',
    '172.09.98.208',
    '172.01.176.208',
    '172.85.121.208',
];

const fakeDomain = 'hidden.domain';

const getFakeGlobalIP = (srcValue: string) => {
    values.add(srcValue);

    const valueIndex = Array.from(values).indexOf(srcValue);

    return fakeGlobalIPs[ valueIndex % (fakeGlobalIPs.length) ];
};

const getFakeDomain = (srcValue: string) => {
    const parts = srcValue.split('.');
    if (parts.length < 3) {
        return fakeDomain;
    }
    return [ parts[ 0 ].replace(/[0-9]/g, '0'), fakeDomain ].join('.');
};

const anonymizeString = (value: string): string => {
    const ipMatches = ipRegex.exec(value);
    if (ipMatches) {
        const ip = ipMatches[ 0 ];
        if ([ '127.', '192.', '10.' ].some(prefix => ip.startsWith(prefix))) {
            return value;
        }

        const fakeGlobalIP = getFakeGlobalIP(ip);

        // console.log(ip, '=>', fakeGlobalIP);

        value = value.replace(ip, fakeGlobalIP);
    }

    const domainMatches = domainRegex.exec(value);
    if (domainMatches) {
        const domain = domainMatches[ 0 ];
        if ([ '.lan', '.localdomain', '.assistant' ].some(ext => domain.endsWith(ext))) {
            return value;
        }

        const fakeDomain = getFakeDomain(domain);

        // console.log(domain, '=>', fakeDomain);

        value = value.replace(domain, fakeDomain);
    }

    return value;
};

const ipRegex = new RegExp(
    String.raw`\b(?!(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[0-1]))(?:\.\d{1,3}){3}\b)(?:\d{1,3}\.){3}\d{1,3}\b`
);

const domainRegex = new RegExp(
    String.raw`\b(?:[a-zA-Z0-9][a-zA-Z0-9\-]*\.)*[a-zA-Z0-9][a-zA-Z0-9\-]*\.[a-zA-Z]{2,}\b`
);
