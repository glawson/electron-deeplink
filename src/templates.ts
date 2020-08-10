const infoPlistTemplate = `	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleTypeRole</key>
			<string>Shell</string >
			<key>CFBundleURLName</key>
			<string>{PROTOCOL}</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>{PROTOCOL}</string>
			</array>
		</dict>
	</array>
</dict>
</plist>`;

export { infoPlistTemplate };
