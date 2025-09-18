import { Col, Grid, Row, theme } from 'antd';
import { LoginForm } from './LoginForm';

const { useBreakpoint } = Grid;

export const Login = () => {
	const screenBreakpoint = useBreakpoint();
	const themeToken = theme.useToken();

	if (screenBreakpoint.md)
		return (
			<>
				{
					<Row>
						<Col
							span="12"
							style={{
								padding: '20px',
							}}
						>
							<div
								className="loginContainer "
								style={{
									backgroundColor: themeToken.token.colorPrimaryBg,
								}}
							>
								<img
									className="centerImg"
									src="../../../public/assets/Logo.jpg"
								/>
							</div>
						</Col>
						<Col span="12">
							<div className="loginFormContainer loginContainer">
								<h2>Bienvenid@</h2>
								<h4>Introduce tus datos de acceso</h4>
								<LoginForm />
							</div>
						</Col>
					</Row>
				}
			</>
		);
	return <></>;
};
