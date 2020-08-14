const infoPlistTemplate = `	<key>CFBundleURLTypes</key>
	<array>
		<dict>
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
