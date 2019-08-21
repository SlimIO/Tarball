declare namespace Tarball {
    interface PackOptions {
        include?: Set<string>;
    }

    interface ExtractOptions {
        deleteTar?: boolean;
        deleteDestinationOnFail?: boolean;
    }

    export function pack(location: string, destination: string, options?: PackOptions): Promise<void>;
    export function extract(location: string, destination: string, options?: ExtractOptions): Promise<void>;
}

export = Tarball;
