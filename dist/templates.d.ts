declare const infoPlistTemplate = "\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLName</key>\n\t\t\t<string>{PROTOCOL}</string>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>{PROTOCOL}</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n</dict>\n</plist>";
export { infoPlistTemplate };
