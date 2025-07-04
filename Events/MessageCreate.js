import { Events } from 'discord.js';
import { client } from '../index.js';
import { addXp } from '../Usersdb/database.js';
import { getGuild } from '../GuildsConfig/configs.js';

// Un mapa para rastrear los últimos mensajes de cada usuario
const userCooldowns = new Map();

export default () => {
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;
        
        const Guild = await getGuild(message.guild.id);

        if (message.content.startsWith('%')) {
            const args = message.content.slice(1).split(' ')[0];  // Extrae el comando
            try{
                // Intenta cargar el módulo del comando
                const commandPath = `../Commands/${args}.js`;
                const commandModule = await import(commandPath);
                console.log(`La Guild ${message.guild.name} - ${message.guild.id} cargo el módulo: ${commandPath}`);

                const adminKeys = ['addAllPlayers', 'clear', 'reset', 'tk', 'addxp']

                if (!adminKeys.includes(args)){
                    try {
                        if (typeof commandModule.run === 'function') {
                            await commandModule.run(message, Guild);
                        } else {
                            console.error(`El comando ${args} no tiene una función 'run'.`);
                            message.reply("Comando no encontrado.");
                        }
                    } catch (error) {
                        console.error(`Error al ejecutar el comando ${args}:`, error);
                        message.reply("Hubo un error al ejecutar el comando.");
                    }
                }else {
                    try {
                        // Obtener el GuildMember del autor del mensaje
                        const guildMember = await message.guild.members.fetch(message.author.id);
                        const Guild = await getGuild(message.guild.id)
                
                        // Comprobar si el autor tiene el rol requerido
                        if (!guildMember.roles.cache.has(Guild.adminRoleId)) {
                            // El usuario no tiene el rol requerido
                            return message.reply('No tienes los permisos necesarios para ejecutar este comando.');
                        }
                
                        // Preguntar al usuario si desea confirmar
                        await message.reply('¿Estás seguro de que deseas ejecutar el comando? Responde con `Y` o `N`.');
                
                        // Crear un filtro para esperar la respuesta del usuario
                        const filter = (response) => {
                            return (
                                ['y', 'n'].includes(response.content.toLowerCase()) &&
                                response.author.id === message.author.id
                            );
                        };
                
                        // Esperar la respuesta del usuario (máximo 15 segundos)
                        const collected = await message.channel.awaitMessages({
                            filter,
                            max: 1,
                            time: 15000, // 15 segundos
                            errors: ['time'],
                        });
                
                        const answer = collected.first().content.toLowerCase();
                
                        if (answer === 'y') {
                            // Confirmación positiva
                            // Ejecutar el comando desde el módulo
                            if (typeof commandModule.run === 'function') {
                                await commandModule.run(message,Guild);
                            } else {
                                console.error(`El comando ${args} no tiene una función 'run'.`);
                                return message.reply('Comando no encontrado.');
                            }
                        } else if (answer === 'n') {
                            // Cancelación
                            return message.reply('Acción cancelada.');
                        }
                    } catch (error) {
                        if (error.name === 'Error [time]') {
                            return message.reply('No se recibió una respuesta a tiempo. Acción cancelada.');
                        }
                        console.error('Error al procesar el comando:', error.message);
                        return message.reply('Ocurrió un error al procesar el comando.');
                    }
                }
            }catch(error){
                console.log(`Error al intentar cargar el comando ${args}: `,error)
                message.reply(`El comando ${args} no existe`)
            }
        }else if (message.content.length > 1){
            try
            {
                const guildId = message.guild.id;
            const userId = message.author.id;
            const now = Date.now();
            const cooldownTime = 2000; // Tiempo en milisegundos (5 segundos)
        
            // Comprobar si el usuario está en cooldown
            if (userCooldowns.has(userId)) {
                const lastMessageTime = userCooldowns.get(userId);
                const timeDifference = now - lastMessageTime;
        
                if (timeDifference < cooldownTime) {
                    // Está en cooldown, no hacer nada
                    return;
                }
            }
        
            // Si no está en cooldown, otorgar experiencia
            const xpAmount = 50; // Cantidad base de experiencia

            const guildMember = await message.guild.members.fetch(userId);

            const rolKeys = [
                'RolId1', 'RolId2', 'RolId3', 'RolId4', 'RolId5', 'RolId6',
                'RolId7', 'RolId8', 'RolId9', 'RolId10', 'RolId11', 'RolId12'
            ];

            if (rolKeys.every(key => Guild[key] !== null)) {
                await addXp(guildId, userId, xpAmount, guildMember, message, null, Guild);
            }

            // Actualizar el tiempo del último mensaje
            userCooldowns.set(userId, now);
            }catch(error){
                console.log(`Error `,error)
            }
        }    
    });
};