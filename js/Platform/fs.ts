namespace Platform.fs {


        export interface ICreateFlags {
            create: boolean;
            exclusive?: boolean;
        }

        export interface Entry {
            isDirectory(): boolean;
            isFile(): boolean;
            get_base_name(): string;
            //get_full_path(): string;
            getParentDirectory(): Promise<DirEntry>;
        }

        export interface FileEntry extends Entry {
            file(success_cb: (blob: Blob) => void, error_cb: (err: Error) => void);
            write(blob: Blob, callback: Function);
        }

        export interface DirEntry extends Entry {
            getChildren(cb: (child_list: Entry[]) => any): void;
            getFile(name: string, flags: ICreateFlags, callback: (res: FileEntry, e: Error) => void): void;
            getDirectory(name: string, flags: ICreateFlags, callback: (res: DirEntry) => void): void;
        }


        class WinRTEntry implements Entry {
            
            protected storage_item: Windows.Storage.IStorageItem = null;
            
            constructor (_storage_item? : Windows.Storage.IStorageItem) {
                this.storage_item = _storage_item;
            }
            
            isDirectory(): boolean {
                return this.storage_item.isOfType(Windows.Storage.StorageItemTypes.folder) ;               
            }
            
            isFile(): boolean {
                return this.storage_item.isOfType(Windows.Storage.StorageItemTypes.file) ;               
            }
             
            get_base_name(): string {
                return this.storage_item.name;
            }
            
            get_full_path(): string {
                return this.storage_item.path;
            }
            
            getParentDirectory(): Promise<WinRTDirEntry> {
                return new Promise<WinRTDirEntry>((resolve, reject) => {
                    this.storage_item.getParentAsync().done((parent) => {
                        resolve(new WinRTDirEntry(parent));
                    });
                });
            }
            
        }
        
        
        class WinRTFileEntry extends WinRTEntry implements FileEntry {
            
            protected storage_item: Windows.Storage.StorageFile;
            
            constructor (file: Windows.Storage.StorageFile) {
                super(file);
            }
            
            file (success_cb: (blob: Blob) => void, error_cb: (err: Error) => void) {
                Windows.Storage.FileIO.readBufferAsync(this.storage_item).done((buffer) => {
                    let dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
                    let bytes = new Uint8Array(buffer.length);
                    dataReader.readBytes(bytes);
                    dataReader.close();
                    success_cb(new Blob([bytes]));
                }, (err) => {
                    error_cb(err);
                });
                success_cb(MSApp.createFileFromStorageFile(this.storage_item));
            }
            
            write (blob: Blob, callback: Function) {
                var reader = new FileReader();
                reader.onloadend = (ev) => {
                    var bytes = new Uint8Array((ev.target as any).result);
                    Windows.Storage.FileIO.writeBytesAsync(this.storage_item, bytes as any).done(() => {
                        callback();
                    });
                }
                reader.onerror = (ev) => {
                    console.log(reader.error);
                }
                reader.readAsArrayBuffer(blob);
            }
            
        }
        
        
        class WinRTDirEntry extends WinRTEntry implements DirEntry {
            
            protected storage_item: Windows.Storage.StorageFolder;
            
            getChildren(cb: (child_list: Entry[]) => any): void {
                this.storage_item.getItemsAsync().done((itemList: Windows.Storage.IStorageItem[]) => {
                    let entryList = itemList.map((item) => {
                        return new WinRTEntry(item);
                    });
                    cb(entryList);
                });
            }
            
            getFile(name: string, flags: ICreateFlags, callback: (res: FileEntry, e: Error) => void): void {
                this.storage_item.getFileAsync(name).done((file) => {
                    
                })
            }
            
            getDirectory(name: string, flags: ICreateFlags, callback: (res: DirEntry) => void): void {
                
            }
            
        }


        // TODO: replace basename with _basename
        class NodeEntry implements Entry {


            protected basename: string;

            protected full_path: string;

            constructor (filename: string, parent_path: any, parent_full_path: string) {

                var path_mod = require('path');


                // The private full path from the root to the file in the real local filesystem.
                // This is required because all file operations in nw uses the full local path.
                this.full_path = path_mod.join(parent_full_path, filename);

                this.basename = path_mod.basename(this.full_path);

            }

            public isDirectory (): boolean {

                var fs = require('fs');
                var stats = fs.statSync(this.full_path);
                if (stats.isDirectory()) {
                    return true;
                } else {
                    return false;
                }

            }

            public isFile (): boolean {

                var fs = require('fs');
                var stats = fs.statSync(this.full_path);
                if (stats.isFile()) {
                    return true;
                } else {
                    return false;
                }

            }

            public get_base_name(): string {

                return this.basename;

            }


            public get_full_path () : string {
                return this.full_path;
            }

            public getParentDirectory () : Promise<NodeDirEntry> {
                var p = require('path');
                let dirname = p.dirname(this.full_path);
                return Promise.resolve(new NodeDirEntry(p.basename(dirname), p.dirname(dirname), p.dirname(dirname)));
            }


        }


        export class NodeFileEntry extends NodeEntry implements FileEntry {


            constructor (filename: string, parent_path: any, parent_full_path: string) {

                super(filename, parent_path, parent_full_path);

            }


            public file (success_cb: (blob: Blob) => void, error_cb : (err: Error) => void) {

                var fs = require('fs');

                fs.readFile(this.full_path, function (e, data) {
                    var blob = new Blob([new Uint8Array(data)]);
                    success_cb(blob);
                });

            }


            public write (blob: Blob, callback) {

                var writeData = (buffer) => {
                    var fs = require('fs');
                    fs.open(this.full_path, 'w', function(err, fd) {
                        if (err != null) {
                            console.debug(err);
                        } else {
                            fs.write(fd, buffer, 0, buffer.length, 0, function(err, written, buffer) {
                                if (err != null) {
                                    console.debug(err);
                                } else {
                                    console.debug("it seems the data was written properly :)");
                                    callback();
                                }
                            });
                        }
                    });
                }

                var reader = new FileReader();
                reader.onload = function() {
                    var buffer = new Buffer(new Uint8Array(this.result));
                    writeData(buffer);
                }
                reader.readAsArrayBuffer(blob);

            }


        }





        class NodeDirEntry extends NodeEntry implements DirEntry {


            constructor (dirname: string, parent_path: string, parent_full_path: string) {

                super(dirname, parent_path, parent_full_path);

            }


            getChildren(cb: (child_list: Entry[]) => any): void {

                var fs = require('fs');
                //console.log(fs);

                fs.readdir(this.full_path, (err, files) => {
                    // @files contains the plain file names of the children; we need to make these into fileEntry's
                    console.log(files);
                    console.log("files");
                    var child_list = [];
                    files.forEach((val, index) => {
                        var stats = fs.statSync(this.full_path);
                        if (stats.isFile()) {
                            var file_entry = new NodeFileEntry(val, this.full_path, this.full_path);
                            child_list.push(file_entry);
                        } else if (stats.isDirectory()) {
                            var dir_entry = new NodeDirEntry(val, this.full_path, this.full_path);
                            child_list.push(dir_entry);
                        }
                    });
                    cb(child_list);
                });

            }


            getFile(name: string, flags: ICreateFlags, callback: (FileEntry, Error) => void): void {

                if (typeof flags == 'undefined' || flags == null) {
                    flags = {
                        create: false,
                        exclusive: false
                    }
                }

                var fs = require('fs');
                var path = require('path');

                var file_path = path.join(this.full_path, name);

                var stat = fs.stat(file_path, (err, stats) => {

                    var return_file = () => {
                        callback(new NodeFileEntry(name, this.full_path, this.full_path), null);
                    }

                    var create_and_return_file = () => {
                        fs.open(file_path, 'w', function(err, fd) {
                            fs.close(fd);
                            return_file();
                        });
                    }

                    if (flags.create) {
                        if (err != null) {
                            if (err.code == "ENOENT") {
                                create_and_return_file();
                            } else {
                                console.debug("sometihng went wrong stating " + file_path);
                            }
                        } else {
                            if (flags.exclusive) {
                                console.debug(file_path + " already exists and the exclusive flag is set. Failed.");
                            } else {
                                if (stats.isDirectory()) {
                                    console.debug(file_path + " is a directory. Failed.");
                                } else {
                                    return_file();
                                }
                            }
                        }
                    } else {
                        if (err != null) {
                            if (err.code == "ENOENT") {
                                console.debug(file_path + " does not exist and create flag is not set. failed");
                            } else {
                                console.debug("sometihng went wrong stating " + file_path);
                            }
                        } else {
                            if (stats.isDirectory()) {
                                console.debug(file_path + " is a directory. Failed.");
                            } else {
                                return_file();
                            }
                        }
                    }

                });


            }


            getDirectory (name: string, flags: ICreateFlags, callback: (DirEntry) => void): void {

                if (typeof flags == 'undefined') {
                    flags = {
                        create: false,
                        exclusive: false
                    }
                }

                var fs = require('fs');
                var path = require('path');

                var file_path = path.join(this.full_path, name);

                var stat = fs.stat(file_path, (err, stats) => {

                    var return_dir = () => {
                        callback(new NodeDirEntry(name, this.full_path, this.full_path));
                    }

                    function create_and_return_dir() {
                        fs.mkdir(file_path, function(err) {
                            if (err == null) {
                                return_dir();
                            } else {
                                console.debug(err);
                            }

                        });
                    }

                    if (flags.create) {
                        if (err != null) {
                            if (err.code == "ENOENT") {
                                create_and_return_dir();
                            } else {
                                console.debug("sometihng went wrong stating " + file_path);
                            }
                        } else {
                            if (flags.exclusive) {
                                console.debug(file_path + " already exists and the exclusive flag is set. Failed.");
                            } else {
                                if (stats.isFile()) {
                                    console.debug(file_path + " is a file. Failed.");
                                } else {
                                    return_dir();
                                }
                            }
                        }
                    } else {
                        if (err != null) {
                            if (err.code == "ENOENT") {
                                console.debug(file_path + " does not exist and create flag is not set. failed");
                            } else {
                                console.debug("sometihng went wrong stating " + file_path);
                            }
                        } else {
                            if (stats.isFile()) {
                                console.debug(file_path + " is a file. Failed.");
                            } else {
                                return_dir();
                            }
                        }
                    }

                });

            }


        }


        function chooseEntryNW (chooser_type: string, success: {(res: Entry): void}, failure) {


            var chooser = document.createElement('input');
            chooser.setAttribute('type', 'file');
            if (chooser_type == "directory") {
                chooser.setAttribute('nwdirectory', '');
            }

            $(chooser).change(function (ev) {
                var fs = require('fs');
                var path = require('path');
                var file_path = chooser.value;
                var basename = path.basename(file_path);
                var parent_path = path.dirname(file_path);
                if (chooser_type == 'directory') {
                    var dir_entry = new NodeDirEntry(basename, undefined, parent_path);
                    success(dir_entry);
                } else if (chooser_type == 'file') {
                    var file_entry = new NodeFileEntry(basename, undefined, parent_path);
                    success(file_entry);
                }
            });

            chooser.click();
            
        }

        function chooseEntryWinRT (chooser_type: string, success: { (res: Entry): void }, failure) {
            console.log("file chooser");
        }

        export let chooseEntry: (chooser_type: string, success: { (res: Entry): void }, failure) => void;

        chooseEntry = (
            Platform.platform === 'node-webkit' ? chooseEntryNW :
            Platform.platform === 'WinRT' ? chooseEntryWinRT : null
        );
        
        
        /**
         * Opens a file with the system's default app.
         * 
         * @param file The file to open.
         */
        export function openWithSystemDefault(file: Platform.fs.Entry) {
            if (Platform.platform === 'node-webkit') {
                let gui = require('nw.gui');
                let nw_entry: NodeEntry = file as NodeEntry;
                gui.Shell.openItem(nw_entry.get_full_path());
            }
        }


        /**
         * Returns a DirEntry for the applications data directory
         * 
         * @param callback Called with the DirEntry for the data directory.
        */
        export function appDataDir (callback: (d: DirEntry) => void) {

            var gui = require('nw.gui');
            var path = require('path');
            var fs = require('fs');

            var data_dir = path.join(gui.App.dataPath, "appdata");

            fs.mkdir(data_dir, function(err) {
                if (err != null) {
                    if (err.code == "EEXIST") {
                        console.log("Data directory already exists")
                    } else {
                        console.debug(err);
                        return;
                    }
                } else {
                    console.debug("Created " + data_dir);
                }
            })

            var basename = path.basename(data_dir);
            var parent_full_path = path.dirname(data_dir);

            callback(new NodeDirEntry(basename, undefined, parent_full_path));

        }


        export function retainEntry(entry: Entry) {

            return JSON.stringify([(entry as NodeEntry).get_full_path(), entry.get_base_name()]);

        }
        
        export function scratchpad () {
            var picker = new Windows.Storage.Pickers.FileOpenPicker();
            picker.fileTypeFilter.replaceAll([".jpg", ".bmp", ".gif", ".png", ".txt"] as any);
            picker.pickSingleFileAsync().then((file) => {
                var blob = new Blob(["Hi, blob!!"]);
                var reader = new FileReader();
                reader.onloadend = (ev) => {
                    var bytes = new Uint8Array((ev.target as any).result);
                    Windows.Storage.FileIO.writeBytesAsync(file, bytes as any);
                }
                reader.onerror = (ev) => {
                    
                }
                reader.readAsArrayBuffer(blob);
            }, (e) => {
                console.log(e);
            });
        }


        export function restoreEntry(id: string, success: (Entry) => void, failure: {(Error): void}) {

            var fs = require('fs');
            var path = require('path');

            try {
                var id_arr = JSON.parse(id);
            } catch (e) {
                failure(e);
                return;
            }
            var full_parent_path = path.dirname(id_arr[0]);
            var root_parent_path = id_arr[1];
            var basename = path.basename(id_arr[0]);

            try {
                var stat = fs.statSync(full_parent_path);
            } catch (e) {
    //            console.error(e.message);
                failure(e);
                return;
            }
            if (stat.isFile()) {
                success(new NodeFileEntry(basename, root_parent_path, full_parent_path));
            } else if (stat.isDirectory()) {
                success(new NodeDirEntry(basename, root_parent_path, full_parent_path));
            }

        }




}
