import { useState } from 'react';
import { ColorUIContext } from './ColorUIContext';
import { AnyObject } from 'antd/es/_util/type';

export const ColorUIProvider = ({ children }: AnyObject) => {
	const [colorUI, setcolorUI] = useState('#9A3B3B');
	return (
		<ColorUIContext.Provider value={{ colorUI, setcolorUI }}>
			{children}
		</ColorUIContext.Provider>
	);
};
