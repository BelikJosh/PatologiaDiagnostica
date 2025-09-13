import { Drawer } from 'antd';
import { ReactNode } from 'react';

interface Props {
	title: string;
	open: boolean;
	setOpen: CallableFunction;
	type?: string;
	formfields?: object[];
	size: 'default' | 'large';
	children?: ReactNode;
}

export const DrawerUI = ({ title, open, setOpen, size, children }: Props) => {
	const onClose = () => {
		setOpen(!open);
	};

	return (
		<>
			<Drawer
				title={title}
				open={open}
				closable={true}
				onClose={() => onClose()}
				size={size}
			>
				{children}
			</Drawer>
		</>
	);
};
