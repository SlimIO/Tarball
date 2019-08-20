declare namespace Tarball {
    interface PackOptions {
        destination: string;
        include?: Set<string>;
    }

    interface ExtractOptions {
        destination: string;
        deleteTar?: boolean;
        deleteDestinationOnFail?: boolean;
    }

    export function pack(location: string, options: PackOptions): Promise<void>;
    export function extract(location: string, options: ExtractOptions): Promise<void>;
}

export = Tarball;
