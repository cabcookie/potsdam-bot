import { readdirSync, rmdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

export const emptyFolder = (folderName: string) => {
  const filesInTmp = readdirSync(`${folderName}`).filter((filename) => filename !== '.pki');

  console.log('Files to be deleted:', filesInTmp);
  
  for (const file of filesInTmp) {
    console.log(`Delete file '${file}'...`);
    try {
      const fileDir = join(folderName, file);
      const stats = statSync(fileDir);
      if (stats.isDirectory()) {
        console.log(`${fileDir} is a folder. Empty it first...`);
        emptyFolder(fileDir);
        console.log(`Now delete folder ${fileDir}...`);
        rmdirSync(fileDir);
        console.log(`Emptied and deleted ${fileDir}.`);
        
      } else {
        const fileSizeMByte = (Math.round(stats.size / 1024 / 1024 *1000) / 1000).toFixed(3);
        console.log(`Filesize: ${fileSizeMByte} MByte`);
        unlinkSync(fileDir);
        console.log(`Successfully deleted ${file}.`);

      }
      
    } catch (error) {
      console.log(error);
    }      
  }
  
}