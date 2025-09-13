import { ConfigProvider } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { useContext, useEffect } from 'react';
import { ColorUIContext } from '../context/ColorUIContext';

export const MainTheme = ({ children }: AnyObject) => {
	const { colorUI } = useContext(ColorUIContext);

	useEffect(() => {}, [colorUI]);

	return (
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: colorUI,
				},
				components: {
					Layout: {
						colorBgTrigger: colorUI,
					},
				},
			}}
		>
			{children}
		</ConfigProvider>
	);
};
