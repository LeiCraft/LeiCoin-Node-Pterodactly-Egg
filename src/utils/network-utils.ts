
export class NetworkUtils {

    static splitHostAndPort(uri: string): [string | null, number | null] {

        const dataArray = uri.split(/:(?=[^:]*$)/);
        const host = NetworkUtils.normalizeIP(this.getIPv6WithoutBrackets(dataArray[0])) || dataArray[0];
        const port = dataArray[1] ? parseInt(dataArray[1]) : null;

        return [host, port];
    }

    static isIPv4(address: string): boolean {
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
        return ipv4Regex.test(address);
    }
    
    static isIPv6(address: string): boolean {
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))|(:((:[0-9a-fA-F]{1,4}){1,7}|:))|(::ffff:(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))$/;
        return ipv6Regex.test(address);
    }

    static normalizeIP(address: string): string | null {
        if (NetworkUtils.isIPv4(address)) {
            // Return IPv4 as is
            return address;
        }
    
        if (NetworkUtils.isIPv6(address)) {
            // Handle IPv6-mapped IPv4 (e.g., "::ffff:192.168.1.1")
            const ipv6Mapped = /^::ffff:([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)$/;
            const match = address.match(ipv6Mapped);
            if (match) {
                return match[1]; // Return the mapped IPv4
            }
    
            // Expand compressed IPv6 (e.g., "2001:db8::1")
            const segments = address.split(":");
    
            // Identify the "::" and calculate how many "0" groups are needed
            const emptyIndex = segments.indexOf("");
            if (emptyIndex !== -1) {
                const zeroSegments = 8 - (segments.length - 1); // Total groups should be 8
                segments.splice(emptyIndex, 1, ...new Array(zeroSegments).fill("0"));
            }
    
            // Normalize each segment to remove leading zeros
            const normalized = segments.map(part => (part === "" ? "0" : parseInt(part, 16).toString(16)));
    
            // Join the normalized segments back
            return normalized.join(":");
        }
    
        return null; // Invalid IP address format
    }
    
    private static getIPv6WithBrackets(address: string): string | null {
        // Remove surrounding brackets if present
        if (address.startsWith("[") && address.endsWith("]")) {
            address = address.slice(1, -1);
        }
    
        // Normalize the IP address
        const normalized = NetworkUtils.normalizeIP(address);
        if (!normalized) return null; // Return null for invalid IP
    
        // Return IPv4 as-is, or wrap IPv6 in brackets
        return NetworkUtils.isIPv4(normalized) ? normalized : `[${normalized}]`;
    }

    private static getIPv6WithoutBrackets(address: string): string {
        // Remove surrounding brackets if present
        if (address.startsWith("[") && address.endsWith("]")) {
            address = address.slice(1, -1);
        }
        return address;
    }

    static formatIP(address: string): string | null {
        const ipv6WithBrackets = NetworkUtils.getIPv6WithBrackets(address);
        if (!ipv6WithBrackets) return null; // Return null for invalid IP
    
        return ipv6WithBrackets;
    }

    static formatAddress(host: string, port: number): string | null {
        const formattedIP = NetworkUtils.formatIP(host) || host;
        //if (!formattedIP) return null; // Return null for invalid IP
    
        return `${formattedIP}:${port}`;
    }

}
