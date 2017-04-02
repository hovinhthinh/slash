import monk from 'monk';
import { mongo as config } from '../../config/database';

export default monk(config.uri);
