export type GroupColor = 'yellow' | 'green' | 'blue' | 'purple' | 'gray';

export type Tile = {
	id: number;
	label: string;
};

export type Group = {
	id: number;
	color: GroupColor;
	tiles: Tile[];
};
