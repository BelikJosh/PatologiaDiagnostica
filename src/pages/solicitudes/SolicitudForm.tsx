import {
	AutoComplete,
	Button,
	DatePicker,
	Form,
	InputNumber,
	Radio,
	Select,
	Space,
	Switch,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import dayjs from 'dayjs';

const dateFormat = 'DD/MM/YYYY';

const options = [
	{ value: 'Juan Gómez' },
	{ value: 'Daniela Romo' },
	{ value: 'Roberto Dobson' },
	{ value: 'Fernando Casillas' },
];

type Props = {
	onNewPatient: CallableFunction;
	onNewDoctor: CallableFunction;
};

export const SolicitudForm = ({ onNewPatient, onNewDoctor }: Props) => {
	return (
		<>
			<Form
				layout="horizontal"
				labelCol={{ span: 8 }}
				wrapperCol={{ span: 16 }}
			>
				<Form.Item label="REQUIERE FIRMA" name="firma">
					<Switch checkedChildren="SI" unCheckedChildren="NO" checked={false}></Switch>
				</Form.Item>
				<Form.Item label="TIPO DE ESTUDIO" required>
					<Radio.Group name="radiogroup" defaultValue={1}>
						<Radio value={1}>CITOLOGÍA</Radio>
						<Radio value={2}>BIOPSIA</Radio>
					</Radio.Group>
				</Form.Item>
				<Form.Item label="MÉDICO SOLICITANTE" required>
					<Space.Compact style={{ width: '100%' }}>
						<AutoComplete
							notFoundContent="No se encontro registro"
							options={options}
							placeholder="Escribe el nombre del médico solicitante"
							filterOption={(inputValue, option) =>
								option!.value
									.toUpperCase()
									.indexOf(inputValue.toUpperCase()) !== -1
							}
						/>
						<Button type="primary" onClick={() => onNewDoctor()}>
							+ Nuevo
						</Button>
					</Space.Compact>
				</Form.Item>
				<Form.Item label="NOMBRE DEL PACIENTE" required>
					<Space.Compact style={{ width: '100%' }}>
						<AutoComplete
							options={options}
							placeholder="Escribe el nombre del paciente"
							filterOption={(inputValue, option) =>
								option!.value
									.toUpperCase()
									.indexOf(inputValue.toUpperCase()) !== -1
							}
						/>
						<Button type="primary" onClick={() => onNewPatient()}>
							+ Nuevo
						</Button>
					</Space.Compact>
				</Form.Item>
				<Form.Item label="FECHA DE RECEPCIÓN">
					<DatePicker defaultValue={dayjs()} format={dateFormat} />
				</Form.Item>
				<Form.Item label="PROCEDENCIA">
					<Select
						placeholder="Selecciona el tipo de pago"
						options={[
							{ value: 0, label: 'Selecciona el tipo de pago', disabled: true },
							{ value: 1, label: 'Directo' },
							{ value: 2, label: 'Laboratorio' },
							{ value: 3, label: 'Consulta' },
							{ value: 4, label: 'Hospital' },
						]}
					></Select>
				</Form.Item>
				<Form.Item label="PRECIO DE ESTUDIO" required>
					<InputNumber
						addonBefore="$"
						formatter={(value) =>
							`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
						}
						placeholder="Precio en moneda nacional"
					/>
				</Form.Item>
				<Form.Item label="ANTICIPO" required>
					<InputNumber
						addonBefore="$"
						formatter={(value) =>
							`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
						}
						placeholder="Precio en moneda nacional"
					/>
				</Form.Item>
				<Form.Item label="TIPO DE PAGO">
					<Select
						placeholder="Selecciona el tipo de pago"
						options={[
							{ value: 0, label: 'Selecciona el tipo de pago', disabled: true },
							{ value: 1, label: 'Transferencia' },
							{ value: 2, label: 'Efectivo' },
							{ value: 3, label: 'Recibo' },
						]}
					></Select>
				</Form.Item>
				<Form.Item label="OBSERVACIONES DEL PAGO">
					<TextArea />
				</Form.Item>
				<Form.Item label="DATOS CLINICOS">
					<TextArea />
				</Form.Item>
				<Form.Item label="DATOS CLINICOS">
					<Button htmlType="submit" type="primary">
						Guardar
					</Button>
					<Button>Cancelar</Button>
				</Form.Item>
			</Form>
		</>
	);
};
