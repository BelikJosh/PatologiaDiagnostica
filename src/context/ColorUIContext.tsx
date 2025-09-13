import { Dispatch, SetStateAction, createContext } from 'react';

export const ColorUIContext = createContext({
	colorUI: '',
	setcolorUI: {} as Dispatch<SetStateAction<string>>,
});
