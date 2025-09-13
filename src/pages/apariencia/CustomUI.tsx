/* eslint-disable @typescript-eslint/no-unused-vars */
import { ColorPicker } from 'antd';
import { useContext } from 'react';
import type { Color } from 'antd/es/color-picker';
import { ColorUIContext } from '../../context/ColorUIContext';

const CustomUI = () => {
	const { colorUI, setcolorUI } = useContext(ColorUIContext);

	const onColorChange = (color: Color) => {
		setcolorUI(color.toHexString());
	};

	return (
		<>
			<h2>Personalización de la Interfaz</h2>
			<ColorPicker
				onChange={onColorChange}
				value={colorUI}
				showText
			></ColorPicker>
		</>
	);
};

export default CustomUI;
